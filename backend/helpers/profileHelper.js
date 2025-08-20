const axios = require("axios");
const cheerio = require("cheerio");
const { extractCookies } = require("../utils/extractUtils");
const logger = require("../config/logger");

class ProfileFetcher {
  constructor(cookie) {
    this.cookie = cookie;
    this.baseUrl = "https://academia.srmist.edu.in";
  }

  async getProfileData() {
    try {
      const response = await axios({
        method: "GET",
        url: `${this.baseUrl}/srm_university/academia-academic-services/report/Student_Profile_Report?urlParams=%7B%7D`,
        headers: {
          accept: "*/*",
          "accept-language": "en-US,en;q=0.9",
          "sec-fetch-dest": "empty",
          "sec-fetch-mode": "cors",
          "sec-fetch-site": "same-origin",
          "x-requested-with": "XMLHttpRequest",
          Referer: `${this.baseUrl}/`,
          cookie: extractCookies(this.cookie),
        },
        responseType: "text",
      });

      if (!response.data) {
        return { status: 204, message: "No content received from server" };
      }

      try {
        return JSON.parse(response.data);
      } catch {
        return { HTML: response.data };
      }
    } catch (error) {
      return { status: 500, error: error.message };
    }
  }

  fixPhotoUrl(url, studentId) {
    if (!url) return null;
    url = url.replace(/&amp;/g, "&").trim();

    if (url.startsWith("/")) {
      return `${this.baseUrl}${url}`;
    }

    if (
      url.includes("filepath=") &&
      url.includes("digestValue=") &&
      !url.includes("://") &&
      !url.startsWith("/") &&
      studentId
    ) {
      return `${this.baseUrl}/srm_university/academia-academic-services/report/Student_Profile_Report/${studentId}/Your_Photo/download-file?${url}`;
    }

    return url;
  }

  extractPhotoFromJsonField(htmlString, studentId) {
    if (!htmlString || typeof htmlString !== "string") return null;

    try {
      const $ = cheerio.load(htmlString);
      const img = $("img");
      if (img.length === 0) return null;

      const photoUrl =
        img.attr("downqual") || img.attr("src") || img.attr("lowqual");

      return photoUrl ? this.fixPhotoUrl(photoUrl, studentId) : null;
    } catch (error) {
      logger.error("Error parsing HTML from JSON field:", error.message);
      return null;
    }
  }

  extractPhotoUrlFromHTML(html, studentId) {
    if (!html) return null;

    const downqualMatch = html.match(/downqual="([^"]*\/Your_Photo\/[^"]+)"/);
    if (downqualMatch?.[1]) {
      return this.fixPhotoUrl(downqualMatch[1], studentId);
    }

    const srcMatch = html.match(/src="([^"]*\/Your_Photo\/[^"]+)"/);
    if (srcMatch?.[1]) {
      return this.fixPhotoUrl(srcMatch[1], studentId);
    }

    const $ = cheerio.load(html);
    const imgElement = $("img.zc-image-view");
    if (imgElement.length > 0) {
      const downqual = imgElement.attr("downqual");
      if (downqual) return this.fixPhotoUrl(downqual, studentId);
      const src = imgElement.attr("src");
      if (src) return this.fixPhotoUrl(src, studentId);
    }

    const filepathMatch = html.match(/filepath=([^"&\s]+)/);
    const digestMatch = html.match(/digestValue=([^"&\s]+)/);
    if (filepathMatch && digestMatch && studentId) {
      return `${this.baseUrl}/srm_university/academia-academic-services/report/Student_Profile_Report/${studentId}/Your_Photo/download-file?filepath=${filepathMatch[1]}&digestValue=${digestMatch[1]}`;
    }

    const downloadMatch = html.match(/\/download-file\?([^"']+)/);
    if (downloadMatch && studentId) {
      const queryParams = downloadMatch[1];
      return this.fixPhotoUrl(
        `/srm_university/academia-academic-services/report/Student_Profile_Report/${studentId}/Your_Photo/download-file?${queryParams}`,
        studentId
      );
    }

    return null;
  }

  constructDirectPhotoUrl(studentId) {
    if (!studentId) return null;
    return `${this.baseUrl}/srm_university/academia-academic-services/report/Student_Profile_Report/${studentId}/Your_Photo/download-file`;
  }

  extractRegNumber(text) {
    if (!text || typeof text !== "string") return null;
    const regNumberMatch = text.match(/RA2\d{12}/);
    return regNumberMatch ? regNumberMatch[0] : null;
  }

  async getProfile() {
    try {
      const profileData = await this.getProfileData();

      if (profileData.status && profileData.status !== 200) {
        return profileData;
      }

      const studentData = {
        id: "",
        name: "",
        photoUrl: null,
        photoBase64: null,
        regNumber: "",
        status: 200,
      };

      if (!profileData || (!profileData.MODEL && !profileData.HTML)) {
        logger.error("Invalid profile data received");
        return studentData;
      }

      if (
        profileData.MODEL?.DATAJSONARRAY &&
        profileData.MODEL.DATAJSONARRAY.length > 0
      ) {
        const userData = profileData.MODEL.DATAJSONARRAY[0];
        studentData.id = userData.unformattedID || userData.ID || "";
        studentData.name = userData.Name || "";
        studentData.regNumber = this.extractRegNumber(userData.Name) || "";

        if (userData.Your_Photo && typeof userData.Your_Photo === "string") {
          studentData.photoUrl = this.extractPhotoFromJsonField(
            userData.Your_Photo,
            studentData.id
          );
        }

        if (
          !studentData.photoUrl &&
          userData.Your_Photo &&
          typeof userData.Your_Photo === "string"
        ) {
          studentData.photoUrl = this.extractPhotoUrlFromHTML(
            userData.Your_Photo,
            studentData.id
          );
        }

        if (!studentData.photoUrl && profileData.HTML) {
          studentData.photoUrl = this.extractPhotoUrlFromHTML(
            profileData.HTML,
            studentData.id
          );
        }

        if (!studentData.photoUrl && studentData.id) {
          if (profileData.HTML) {
            const photoPathMatch = profileData.HTML.match(
              new RegExp(`/${studentData.id}/Your_Photo/([^"'\\s]+)`)
            );
            if (photoPathMatch?.[1]) {
              studentData.photoUrl = `${this.baseUrl}/srm_university/academia-academic-services/report/Student_Profile_Report/${studentData.id}/Your_Photo/${photoPathMatch[1]}`;
            }
          }
          if (!studentData.photoUrl) {
            studentData.photoUrl = this.constructDirectPhotoUrl(studentData.id);
          }
        }
      } else if (profileData.HTML) {
        const $ = cheerio.load(profileData.HTML);
        const idMatch = profileData.HTML.match(
          /Student_Profile_Report\/(\d+)\/Your_Photo/
        );
        if (idMatch?.[1]) studentData.id = idMatch[1];

        studentData.photoUrl = this.extractPhotoUrlFromHTML(
          profileData.HTML,
          studentData.id
        );
        studentData.regNumber = this.extractRegNumber(profileData.HTML) || "";

        $("table").each((_, table) => {
          $(table)
            .find("tr")
            .each((_, row) => {
              const cells = $(row).find("td");
              if (cells.length >= 2) {
                const label = $(cells[0])
                  .text()
                  .trim()
                  .toLowerCase()
                  .replace(/:/g, "")
                  .replace(/\s+/g, "_");
                const value = $(cells[1]).text().trim();
                if (label && value) studentData[label] = value;
              }
            });
        });
      }

      if (studentData.photoUrl) {
        try {
          const photoData = await this.getDirectPhotoBase64(studentData.photoUrl);
          if (photoData) studentData.photoBase64 = photoData.dataUrl;
        } catch (error) {
          logger.error(`Failed to get base64 image: ${error.message}`);
        }
      }

      return { ...studentData, status: 200 };
    } catch (error) {
      logger.error(`Profile extraction error: ${error.message}`);
      return {
        id: "",
        name: "",
        photoUrl: null,
        photoBase64: null,
        regNumber: "",
        status: 500,
        error: error.message,
      };
    }
  }

  async getDirectPhotoBase64(url) {
    if (!url) {
      return null;
    }

    try {
      const imageResponse = await axios({
        method: "GET",
        url,
        headers: {
          Referer: `${this.baseUrl}/srm_university/academia-academic-services/report/Student_Profile_Report`,
          cookie: extractCookies(this.cookie),
        },
        responseType: "arraybuffer",
        validateStatus: (status) => status < 400,
        timeout: 10000,
      });

      if (!imageResponse.data || imageResponse.data.length === 0) {
        return null;
      }

      const base64 = Buffer.from(imageResponse.data, "binary").toString("base64");
      const contentType = imageResponse.headers["content-type"] || "image/jpeg";
      return {
        dataUrl: `data:${contentType};base64,${base64}`,
        contentType,
        base64,
      };
     } catch (error) {
      logger.error(`Photo fetch error: ${error.message}`);
      return null;
    }
  }
}

module.exports = ProfileFetcher;