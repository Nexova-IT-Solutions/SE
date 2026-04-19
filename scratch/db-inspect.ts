import { db } from "../src/lib/db";

async function main() {
  const products = await db.product.findMany({
    take: 5,
    select: {
      id: true,
      name: true,
      colors: true,
      productImages: true,
    }
  });
  console.log(JSON.stringify(products, null, 2));
}

main();
