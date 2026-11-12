const express = require("express");
const https = require("https");

const router = express.Router();

const SOURCE_URL =
  "https://crystalballmarkets.com/markets/api/v1/quotes.json";

let cachedData = null;
let lastFetch = 0;
let pendingRequest = null;

function downloadQuotes() {
  return new Promise((resolve, reject) => {
    const request = https.get(SOURCE_URL, response => {
      if (response.statusCode !== 200) {
        response.resume();
        reject(new Error("مصدر الأسعار غير متاح حالياً"));
        return;
      }

      let body = "";

      response.setEncoding("utf8");
      response.on("data", chunk => {
        body += chunk;
        if (body.length > 5 * 1024 * 1024) {
          request.destroy(new Error("حجم بيانات الأسعار كبير"));
        }
      });

      response.on("end", () => {
        try {
          const data = JSON.parse(body);

          if (!Array.isArray(data.data)) {
            throw new Error("صيغة بيانات الأسعار غير صحيحة");
          }

          resolve(data);
        } catch (error) {
          reject(error);
        }
      });
    });

    request.setTimeout(10000, () => {
      request.destroy(new Error("انتهت مهلة الاتصال بمصدر الأسعار"));
    });

    request.on("error", reject);
  });
}

router.get("/quotes", async (req, res) => {
  try {
    const now = Date.now();

    if (cachedData && now - lastFetch < 60000) {
      return res.json({
        success: true,
        ...cachedData,
        cached: true
      });
    }

    if (!pendingRequest) {
      pendingRequest = downloadQuotes();
    }

    const data = await pendingRequest;

    cachedData = {
      updated: data.updated || null,
      attribution: data.attribution || null,
      notice: data.notice || null,
      data: data.data.filter(item =>
        ["crypto", "metals", "forex", "stocks", "indices"].includes(
          String(item.assetClass || "").toLowerCase()
        )
      )
    };

    lastFetch = Date.now();

    res.json({
      success: true,
      ...cachedData,
      cached: false
    });
  } catch (error) {
    res.status(503).json({
      success: false,
      message: "تعذر جلب أسعار الأسواق حالياً"
    });
  } finally {
    pendingRequest = null;
  }
});

module.exports = router;
