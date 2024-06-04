export const getOrderBy = (order) => {
  let orderBy;
  switch (order) {
    case "oldest":
      orderBy = { createdAt: "asc" };
      break;
    case "newest":
      orderBy = { createdAt: "desc" };
      break;
    case "low_price":
      orderBy = { sellingPrice: "asc" };
      break;
    case "high_price":
      orderBy = { sellingPrice: "desc" };
      break;
  }

  return orderBy;
};

export const myCardGetOrderBy = (order) => {
  let orderBy;
  switch (order) {
    case "oldest":
      orderBy = { createdAt: "asc" };
      break;
    case "newest":
      orderBy = { createdAt: "desc" };
      break;
    case "low_price":
      orderBy = { price: "asc" };
      break;
    case "high_price":
      orderBy = { price: "desc" };
      break;
  }

  return orderBy;
};
