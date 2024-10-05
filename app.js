const fileSystem = require("fs").promises;

/**
 * Reads a text file and returns its contents as an array of lines.
 *
 * @async
 * @function readTextFile
 * @param {string} filePath - The path to the text file to be read.
 * @returns {Promise<string[]>} A promise that resolves to an array of strings,
 *                              where each string is a line from the text file.
 * @throws {Error} If there is an error reading the file, it will log the error to the console.
 */
async function readTextFile(filePath) {
  try {
    const data = await fileSystem.readFile(filePath, "utf8");
    const modifiedData = data.split(/\r?\n/);
    return modifiedData;
  } catch (error) {
    console.log("Error reading file: " + error);
  }
}

/**
 * Converts an array of CSV formatted strings into an array of JSON objects.
 *
 * @async
 * @function convertDataToJson
 * @param {string[]} modifiedData - An array of strings, where each string represents a line from a Text file.
 * @returns {Promise<Object[]>} A promise that resolves to an array of JSON objects,
 *                              where each object represents a sales record with properties Date, SKU, Unit_Price, Quantity, and Total_Price.
 * @throws {Error} If there is an error during the conversion process, it will log the error to the console.
 */
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

/**
 * Processes sales data and organizes it into a map grouped by month.
 * Each month contains SKU sales data, including total quantity, total price,
 * order count, minimum, maximum, and average quantity sold.
 *
 * @async
 * @function getMonthWiseSalesData
 * @param {Array<Object>} salesJsonData - An array of sales data objects, where each object contains
 *                                         properties such as Date, SKU, Quantity, and Total_Price.
 * @returns {Promise<Map<string, Map<string, Object>>>} A promise that resolves to a map
 *                                                      where the keys are month names and the values
 *                                                      are maps of SKU sales data.
 *                                                      Each SKU map contains:
 *                                                      - quantity: Total quantity sold (number)
 *                                                      - total_price: Total sales amount (number)
 *                                                      - orderCount: Number of orders (number)
 *                                                      - min: Minimum quantity sold in an order (number)
 *                                                      - max: Maximum quantity sold in an order (number)
 *                                                      - avg: Average quantity sold per order (number)
 * @throws {Error} If there is an error processing the sales data, it will log the error to the console.
 */
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

/**
 * Calculates the total sales amount for the store by summing the total price
 * of all SKU sales data across all months.
 *
 * @param {Map<string, Map<string, Object>>} monthWiseSalesData - A map where the keys are month names
 *                                                                 and the values are maps of SKU sales data.
 *                                                                 Each SKU map contains:
 *                                                                 - quantity: Total quantity sold (number)
 *                                                                 - total_price: Total sales amount (number)
 *                                                                 - orderCount: Number of orders (number)
 *                                                                 - min: Minimum quantity sold in an order (number)
 *                                                                 - max: Maximum quantity sold in an order (number)
 *                                                                 - avg: Average quantity sold per order (number)
 * @returns {number} The total sales amount for the store.
 * @throws {Error} If there is an error calculating the total sales, it will log the error to the console.
 */
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
    console.log("Error reading file: " + error);
  }
}

/**
 * Calculates the total sales amount for each month and returns a map of monthly totals.
 *
 * @param {Map<string, Map<string, Object>>} monthWiseSalesData - A map where the keys are month names
 *                                                                 and the values are maps of SKU sales data.
 *                                                                 Each SKU map contains:
 *                                                                 - quantity: Total quantity sold (number)
 *                                                                 - total_price: Total sales amount (number)
 *                                                                 - orderCount: Number of orders (number)
 *                                                                 - min: Minimum quantity sold in an order (number)
 *                                                                 - max: Maximum quantity sold in an order (number)
 *                                                                 - avg: Average quantity sold per order (number)
 * @returns {Map<string, number>} A map where the keys are month names and the values are the total sales
 *                                amount for each month.
 * @throws {Error} If there is an error calculating the monthly total sales, it will log the error to the console.
 */
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
    console.log("Error reading file: " + error);
  }
}

/**
 * Determines the most popular item sold for each month based on quantity sold.
 *
 * @param {Map<string, Map<string, Object>>} monthWiseSalesData - A map where the keys are month names
 *                                                                 and the values are maps of SKU sales data.
 *                                                                 Each SKU map contains:
 *                                                                 - quantity: Total quantity sold (number)
 *                                                                 - total_price: Total sales amount (number)
 *                                                                 - orderCount: Number of orders (number)
 *                                                                 - min: Minimum quantity sold in an order (number)
 *                                                                 - max: Maximum quantity sold in an order (number)
 *                                                                 - avg: Average quantity sold per order (number)
 * @returns {Map<string, Object>} A map where the keys are month names and the values are objects
 *                                representing the most popular item sold, containing:
 *                                - Item_Name: Name of the SKU (string)
 *                                - Total_Quantity_Sold: Total quantity sold for that SKU (number)
 * @throws {Error} If there is an error determining the most popular items, it will log the error to the console.
 */
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
    console.log("Error reading file: " + error);
  }
}

/**
 * Finds the item that generated the most revenue for each month.
 *
 * @param {Map<string, Map<string, Object>>} monthWiseSalesData - A map where the keys are month names
 *                                                                 and the values are maps of SKU sales data.
 *                                                                 Each SKU map contains:
 *                                                                 - quantity: Total quantity sold (number)
 *                                                                 - total_price: Total sales amount (number)
 *                                                                 - orderCount: Number of orders (number)
 *                                                                 - min: Minimum quantity sold in an order (number)
 *                                                                 - max: Maximum quantity sold in an order (number)
 *                                                                 - avg: Average quantity sold per order (number)
 * @returns {Map<string, Object>} A map where the keys are month names and the values are objects
 *                                representing the item generating the most revenue, containing:
 *                                - Item_Name: Name of the SKU (string)
 *                                - Revenue: Total revenue generated by that SKU (number)
 * @throws {Error} If there is an error finding the item, it will log the error to the console.
 */
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
    console.log("Error reading file: " + error);
  }
}

/**
 * Retrieves the min, max, and average number of orders for the most popular item in each month.
 *
 * @param {Map<string, Object>} mostPopularItems - A map where the keys are month names and the values
 *                                                 are objects representing the most popular items,
 *                                                 containing:
 *                                                 - Item_Name: Name of the SKU (string)
 * @param {Map<string, Map<string, Object>>} monthWiseSalesData - A map where the keys are month names
 *                                                                 and the values are maps of SKU sales data.
 *                                                                 Each SKU map contains:
 *                                                                 - quantity: Total quantity sold (number)
 *                                                                 - total_price: Total sales amount (number)
 *                                                                 - orderCount: Number of orders (number)
 *                                                                 - min: Minimum quantity sold in an order (number)
 *                                                                 - max: Maximum quantity sold in an order (number)
 *                                                                 - avg: Average quantity sold per order (number)
 * @returns {Map<string, Object>} A map where the keys are month names and the values are objects containing:
 *                                - Item_Name: Name of the SKU (string)
 *                                - min: Minimum quantity sold in an order for that item (number)
 *                                - max: Maximum quantity sold in an order for that item (number)
 *                                - avg: Average quantity sold per order for that item (number)
 * @throws {Error} If there is an error finding the data, it will log the error to the console.
 */
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
    console.log("Error reading file: " + error);
  }
}

/**
 * Processes the sales data from a text file, converts it to JSON format, and performs various calculations:
 * - Finds the total sales of the store.
 * - Determines the month-wise total sales.
 * - Identifies the most popular item (by quantity sold) for each month.
 * - Finds the item generating the most revenue for each month.
 * - For the most popular item, calculates the min, max, and average number of orders each month.
 *
 * @async
 * @function ProcessData
 * @returns {Promise<void>} A promise that resolves when all processing is complete and logs the results.
 * @throws {Error} If there is an error reading the file or processing the data, it logs the error to the console.
 */

async function ProcessData() {
  //read data from text file
  const filePath = "./Sales_Data.txt";
  const salesData = await readTextFile(filePath);

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
}

ProcessData();
