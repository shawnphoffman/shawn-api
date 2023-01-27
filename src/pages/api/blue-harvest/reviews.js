import { fetchHtmlWithCache } from "@/utils/fetchWithCache";
import * as cheerio from "cheerio";

const dataUrl =
  "https://podcasts.apple.com/us/podcast/blue-harvest-a-star-wars-podcast/id1009917662?see-all=reviews";

async function scrapeReviewData(data) {
  const $ = cheerio.load(data);

  const pageTitle = $("h1 span:first").text();

  console.log(`Title: ${pageTitle}`);

  const rating = $(".we-customer-ratings__averages__display").text();
  const ratingString = $(".we-customer-ratings__averages").text();

  console.log(`Rating: ${rating}, RatingString: ${ratingString}`);

  // Collect Reviews
  const reviews = $(".we-customer-review")
    .map(function () {
      const title = $(this).find("h3").text().trim();
      const author = $(this).find(".we-customer-review__user").text().trim();
      const date = $(this).find("time").text().trim();
      const text = $(this).find("p").text().trim();
      const stars = $(this)
        .find("figure")
        .attr("aria-label")
        .replace(" out of 5", "");

      return {
        title,
        author,
        date,
        text,
        stars,
      };
    })
    .toArray();

  console.log(`Review Count: ${reviews.length}`);

  return {
    rating,
    ratingString,
    ratingsUrl: dataUrl,
    reviews,
  };
}

export default async function handler(req, res) {
  const requestOptions = {
    method: "GET",
  };
  const data = await fetchHtmlWithCache(dataUrl, requestOptions);

  const responseData = await scrapeReviewData(data);

  res.status(200).send(responseData);
}
