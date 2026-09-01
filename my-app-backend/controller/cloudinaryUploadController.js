const crypto = require("crypto");

const signCloudinaryParams = (params, apiSecret) => {
  const stringToSign = Object.entries(params)
    .filter(([, value]) => value !== undefined && value !== null && value !== "")
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, value]) => `${key}=${value}`)
    .join("&");

  return crypto
    .createHash("sha1")
    .update(`${stringToSign}${apiSecret}`)
    .digest("hex");
};

const createCloudinaryUploadSignature = (req, res) => {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  const folder = process.env.CLOUDINARY_UPLOAD_FOLDER || "park-paradise";

  if (!cloudName || !apiKey || !apiSecret) {
    return res.status(500).json({
      message:
        "Cloudinary is not configured. Add CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET.",
    });
  }

  const { purpose = "park-paradise-image" } = req.body;
  const timestamp = Math.round(Date.now() / 1000);
  const uploadFolder = `${folder}/${purpose}`;
  const paramsToSign = {
    folder: uploadFolder,
    timestamp,
  };

  const signature = signCloudinaryParams(paramsToSign, apiSecret);

  res.json({
    cloudName,
    apiKey,
    timestamp,
    signature,
    folder: uploadFolder,
    uploadUrl: `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
  });
};

module.exports = {
  createCloudinaryUploadSignature,
};
