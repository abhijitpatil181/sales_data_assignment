const fileSystem = require("fs").promises;

async function readTextFile() {
  try {
    const data = await fileSystem.readFile("./Sales_Data.txt", "utf8");
    const modifiedData = data.split(/\r?\n/);
    return modifiedData;
  } catch (error) {
    console.log("Error reading file: " + error);
  }
}

async function convertDataToJson(modifiedData) {
  try {
    const salesJsonData = modifiedData
      .map((element, index) => {
        if (index === 0) return null;
        const data = element.split(",");
        if (data.length !== 5) {
          return null;
        }

        return {
          Date: data[0],
          SKU: data[1],
          Unit_Price: data[2],
          Quantity: data[3],
          Total_Price: data[4],
        };
      })
      .filter((item) => item !== null);

    return salesJsonData;
  } catch (error) {
    console.log("Error reading file: " + error);
  }
}

async function getMonthWiseSalesData(salesJsonData) {
  let monthlySalesData = new Map();

  try {
    salesJsonData.forEach((data) => {
      const date = new Date(data.Date);
      const month = date.toLocaleString("default", { month: "long" });
      const sku = data.SKU;
      const quantity = data.Quantity ?? "0";
      const parsedQuantity = parseInt(quantity, 10);
      const total_price = data.Total_Price ?? "0";
      const parsedTotalPrice = parseFloat(total_price);

      if (!monthlySalesData.has(month)) {
        monthlySalesData.set(month, new Map());
      }

      const skuSales = monthlySalesData.get(month);

      if (skuSales.has(sku)) {
        const existingData = skuSales.get(sku);
        existingData.quantity += parsedQuantity;
        existingData.total_price += parsedTotalPrice;
        existingData.orderCount += 1;
        existingData.min = Math.min(existingData.min, parsedQuantity);
        existingData.max = Math.max(existingData.max, parsedQuantity);
        existingData.avg = existingData.quantity / existingData.orderCount;
        skuSales.set(sku, existingData);
      } else {
        skuSales.set(sku, {
          quantity: parsedQuantity,
          total_price: parsedTotalPrice,
          orderCount: 1,
          min: parsedQuantity,
          max: parsedQuantity,
          avg: parsedQuantity,
        });
      }
    });

    return monthlySalesData;
  } catch (error) {
    console.log("Error reading file: " + error);
  }
}

function getTotalSalesOfStore(monthWiseSalesData) {
  try {
    let totalSales = 0;
    monthWiseSalesData.forEach((skuSales, month) => {
      skuSales.forEach((data) => {
        totalSales += data.total_price;
      });
    });
    return totalSales;
  } catch (error) {
    console.log("Error while accessing monthWiseSalesData: " + error);
  }
}

function getMonthWiseTotalSales(monthWiseSalesData) {
  try {
    const monthlyTotalSales = new Map();

    monthWiseSalesData.forEach((skuSales, month) => {
      let totalSalesForMonth = 0;

      skuSales.forEach((data, sku) => {
        totalSalesForMonth += data.total_price;
      });

      monthlyTotalSales.set(month, totalSalesForMonth);
    });
    return monthlyTotalSales;
  } catch (error) {
    console.log("Error while accessing monthWiseSalesData:" + error);
  }
}

function getMostPopularItemSold(monthWiseSalesData) {
  try {
    const mostPopularItems = new Map();

    monthWiseSalesData.forEach((skuSales, month) => {
      let popularItem = null;

      skuSales.forEach((data, sku) => {
        if (!popularItem || data.quantity > popularItem.Total_Quantity_Sold) {
          popularItem = {
            Item_Name: sku,
            Total_Quantity_Sold: data.quantity,
          };
        }
      });

      if (popularItem) {
        mostPopularItems.set(month, popularItem);
      }
    });

    return mostPopularItems; // Return the map of most popular items
  } catch (error) {
    console.log("Error while accessing monthWiseSalesData: " + error);
  }
}

function getItemGeneratingMostRevenueInEachMonth(monthWiseSalesData) {
  try {
    const mostRevenueItemInEachMonth = new Map();

    monthWiseSalesData.forEach((skuSales, month) => {
      let popularItem = null;

      skuSales.forEach((data, sku) => {
        if (!popularItem || data.quantity > popularItem.Revenue) {
          popularItem = {
            Item_Name: sku,
            Revenue: data.total_price,
          };
        }
      });

      if (popularItem) {
        mostRevenueItemInEachMonth.set(month, popularItem);
      }
    });

    return mostRevenueItemInEachMonth; // Return the map of most popular items
  } catch (error) {
    console.log("Error while accessing monthWiseSalesData:" + error);
  }
}

function findMostPopularItemData(mostPopularItems, monthWiseSalesData) {
  try {
    const mostPopularItemData = new Map();

    mostPopularItems.forEach((item, month) => {
      const skuSales = monthWiseSalesData.get(month);
      const itemData = skuSales.get(item.Item_Name);

      mostPopularItemData.set(month, {
        Item_Name: item.Item_Name,
        min: itemData.min,
        max: itemData.max,
        avg: itemData.avg,
      });
    });
    return mostPopularItemData;
  } catch (error) {
    console.log(
      "Error while accessing mostPopularItems or monthWiseSalesData: " + error
    );
  }
}

async function ProcessData() {
  try {
    //read data from text file
    const salesData = await readTextFile();

    //convert it to json format for better access and modularity
    const salesJsonData = await convertDataToJson(salesData);

    //find month wise data
    const monthWiseSalesData = await getMonthWiseSalesData(salesJsonData);
    // console.log("monthWiseSalesData", monthWiseSalesData);

    //Total sales of the store
    const totalSales = getTotalSalesOfStore(monthWiseSalesData);
    console.log("totalSales ", totalSales);

    //Month wise sales totals
    const monthWiseTotalSales = getMonthWiseTotalSales(monthWiseSalesData);
    console.log("monthWiseTotalSales ", monthWiseTotalSales);

    //Most popular item (most quantity sold) in each month
    const mostPopularItemSold = getMostPopularItemSold(monthWiseSalesData);
    console.log("mostPopularItemSold ", mostPopularItemSold);

    //Items generating most revenue in each month
    const mostRevenueItemInEachMonth =
      getItemGeneratingMostRevenueInEachMonth(monthWiseSalesData);
    console.log("mostRevenueItemInEachMonth ", mostRevenueItemInEachMonth);

    //For the most popular item, find the min, max and average number of orders each month
    const mostPopularItemData = findMostPopularItemData(
      mostPopularItemSold,
      monthWiseSalesData
    );
    console.log("mostPopularItemData", mostPopularItemData);
  } catch (error) {
    console.log("Error While Processing data");
  }
}

ProcessData();
