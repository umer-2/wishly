import prisma from "../db.server";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...corsHeaders,
    },
  });
}

export async function loader({ request }) {
  try {
    /*
     * CORS preflight
     */
    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: corsHeaders,
      });
    }

    /*
     * GET CUSTOMER WISHLIST
     *
     * Example:
     * /api/wishlist?customerId=9259301699819
     */

    const url = new URL(request.url);

    const customerId =
      url.searchParams.get("customerId");

    if (!customerId) {
      return jsonResponse(
        {
          success: false,
          message: "customerId is required",
        },
        400
      );
    }

    /*
     * Find wishlist in Prisma
     */

    const wishlist =
      await prisma.wishlist.findUnique({
        where: {
          customerId: String(customerId),
        },
      });

    /*
     * Customer has no wishlist yet
     */

    if (!wishlist) {
      return jsonResponse({
        success: true,
        message: "Wishlist not found",
        wishlist: {
          customerId: String(customerId),
          shop: "",
          items: [],
        },
      });
    }

    /*
     * Return customer's wishlist
     */

    return jsonResponse({
      success: true,
      message: "Wishlist retrieved successfully",
      wishlist: {
        id: wishlist.id,
        customerId: wishlist.customerId,
        shop: wishlist.shop,
        items: wishlist.items,
        createdAt: wishlist.createdAt,
        updatedAt: wishlist.updatedAt,
      },
    });

  } catch (error) {
    console.error(
      "Wishly GET API error:",
      error
    );

    return jsonResponse(
      {
        success: false,
        message: "Failed to retrieve wishlist",
      },
      500
    );
  }
}


export async function action({ request }) {
  try {
    /*
     * CORS preflight
     */
    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: corsHeaders,
      });
    }

    /*
     * POST ONLY
     */

    if (request.method !== "POST") {
      return jsonResponse(
        {
          success: false,
          message: "Method not allowed",
        },
        405
      );
    }

    /*
     * Read request body
     */

    const body = await request.json();

    const {
      customerId,
      shop,
      items,
    } = body;

    /*
     * Validate customer ID
     */

    if (!customerId) {
      return jsonResponse(
        {
          success: false,
          message: "customerId is required",
        },
        400
      );
    }

    /*
     * Validate shop
     */

    if (!shop) {
      return jsonResponse(
        {
          success: false,
          message: "shop is required",
        },
        400
      );
    }

    /*
     * Validate items
     */

    if (!Array.isArray(items)) {
      return jsonResponse(
        {
          success: false,
          message: "items must be an array",
        },
        400
      );
    }

    /*
     * Save wishlist to Prisma
     */

    const wishlist =
      await prisma.wishlist.upsert({
        where: {
          customerId: String(customerId),
        },

        update: {
          shop,
          items,
        },

        create: {
          customerId: String(customerId),
          shop,
          items,
        },
      });

    /*
     * Return saved wishlist
     */

    return jsonResponse({
      success: true,
      message: "Wishlist saved successfully",

      wishlist: {
        id: wishlist.id,
        customerId: wishlist.customerId,
        shop: wishlist.shop,
        items: wishlist.items,
        createdAt: wishlist.createdAt,
        updatedAt: wishlist.updatedAt,
      },
    });

  } catch (error) {
    console.error(
      "Wishly POST API error:",
      error
    );

    return jsonResponse(
      {
        success: false,
        message: "Failed to save wishlist",
      },
      500
    );
  }
}


export function headers() {
  return corsHeaders;
}