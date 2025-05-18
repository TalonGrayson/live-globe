import { json } from "@remix-run/node";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function loader() {
  try {
    const locations = await prisma.geoLocation.findMany({
      orderBy: {
        dateAdded: 'desc'
      }
    });
    
    return json(locations);
  } catch (error) {
    console.error('Error fetching locations:', error);
    throw new Response('Error fetching locations', { status: 500 });
  }
} 