const Product = require("../model/productModel");
const Restaurant = require("../model/restaurantModel");

// Create a new product
exports.createProduct = async (req, res) => {
  try {
    const { name, amount, isActive } = req.body;
    const user_id = req.user.id;

    const restaurant = await Restaurant.findOne({ user_id });
    if (!restaurant) {
      return res.status(403).json({ message: "Unauthorized: No restaurant associated with this user" });
    }
    const restaurant_id = restaurant._id;

    if (!name || amount === undefined) {
      return res.status(400).json({ message: "Name and amount are required" });
    }

    const newProduct = new Product({
      restaurant_id,
      name,
      amount,
      isActive: isActive !== undefined ? isActive : true,
    });

    await newProduct.save();
    return res.status(201).json({ message: "Product created successfully", data: newProduct });
  } catch (err) {
    console.error("Create Product Error:", err);
    return res.status(500).json({ message: "Server error", error: err.message });
  }
};

// Get products by restaurant
exports.getProductsByRestaurant = async (req, res) => {
  try {
    const user_id = req.user.id;

    const restaurant = await Restaurant.findOne({ user_id });
    if (!restaurant) {
      return res.status(403).json({ message: "Unauthorized: No restaurant associated with this user" });
    }
    const restaurant_id = restaurant._id;

    const products = await Product.find({ restaurant_id }).sort({ createdAt: -1 });
    return res.status(200).json({ data: products });
  } catch (err) {
    console.error("Get Products Error:", err);
    return res.status(500).json({ message: "Server error", error: err.message });
  }
};

// Update product
exports.updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, amount, isActive } = req.body;
    const user_id = req.user.id;

    const restaurant = await Restaurant.findOne({ user_id });
    if (!restaurant) {
      return res.status(403).json({ message: "Unauthorized" });
    }
    const restaurant_id = restaurant._id;

    const product = await Product.findOne({ _id: id, restaurant_id });
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    if (name) product.name = name;
    if (amount !== undefined) product.amount = amount;
    if (isActive !== undefined) product.isActive = isActive;

    await product.save();
    return res.status(200).json({ message: "Product updated successfully", data: product });
  } catch (err) {
    console.error("Update Product Error:", err);
    return res.status(500).json({ message: "Server error", error: err.message });
  }
};

// Delete product
exports.deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const user_id = req.user.id;

    const restaurant = await Restaurant.findOne({ user_id });
    if (!restaurant) {
      return res.status(403).json({ message: "Unauthorized" });
    }
    const restaurant_id = restaurant._id;

    const product = await Product.findOneAndDelete({ _id: id, restaurant_id });
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    return res.status(200).json({ message: "Product deleted successfully" });
  } catch (err) {
    console.error("Delete Product Error:", err);
    return res.status(500).json({ message: "Server error", error: err.message });
  }
};

// Get active products for a specific restaurant (For customers)
exports.getProductsForCustomer = async (req, res) => {
  try {
    const { id } = req.params; // restaurant ID (from Restaurant model _id)

    if (!id) {
      return res.status(400).json({ message: "Restaurant ID is required" });
    }

    const products = await Product.find({ restaurant_id: id, isActive: true }).sort({ name: 1 });
    return res.status(200).json({ data: products });
  } catch (err) {
    console.error("Get Products For Customer Error:", err);
    return res.status(500).json({ message: "Server error", error: err.message });
  }
};
