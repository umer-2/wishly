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
  // Handle browser CORS preflight
  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  return jsonResponse({
    success: true,
    message: "Wishly wishlist API is working",
  });
}

export async function action({ request }) {
  try {
    // Handle browser CORS preflight
    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: corsHeaders,
      });
    }

    if (request.method !== "POST") {
      return jsonResponse(
        {
          success: false,
          message: "Method not allowed",
        },
        405
      );
    }

    const body = await request.json();

    const { customerId, shop, items } = body;

    if (!customerId) {
      return jsonResponse(
        {
          success: false,
          message: "customerId is required",
        },
        400
      );
    }

    if (!shop) {
      return jsonResponse(
        {
          success: false,
          message: "shop is required",
        },
        400
      );
    }

    if (!Array.isArray(items)) {
      return jsonResponse(
        {
          success: false,
          message: "items must be an array",
        },
        400
      );
    }

    const wishlist = await prisma.wishlist.upsert({
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
    console.error("Wishly API error:", error);

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