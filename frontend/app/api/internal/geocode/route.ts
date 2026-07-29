import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("query");

  // Placeholder geocoding endpoint
  return NextResponse.json({
    success: true,
    query,
    results: [
      {
        name: query || "Sample Location",
        latitude: 12.9716,
        longitude: 77.5946,
      },
    ],
  });
}
