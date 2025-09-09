app.get("/api/wallet/:email", async (req, res) => {
  try {
    const { email } = req.params;

    // Validate email format
    if (!isValidEmail(email)) {
      return res.status(400).json({ error: "Invalid email format" });
    }

    const query = `
      SELECT id, email, mnemonic, public_key, created_at
      FROM wallets
      WHERE email = $1
      ORDER BY created_at DESC
    `;

    const result = await pool.query(query, [email]);

    res.json({
      success: true,
      data: result.rows,
      count: result.rows.length,
      message: `Found ${result.rows.length} wallet(s) for ${email}`,
    });
  } catch (error) {
    console.error("API Error:", error);
    res.status(500).json({
      error: "Internal server error",
      details: error.message,
    });
  }
});

// Get wallet count by email endpoint
app.get("/api/wallet/count/:email", async (req, res) => {
  try {
    const { email } = req.params;

    if (!isValidEmail(email)) {
      return res.status(400).json({ error: "Invalid email format" });
    }

    const query = "SELECT COUNT(*) FROM wallets WHERE email = $1";
    const result = await pool.query(query, [email]);

    res.json({
      success: true,
      email,
      count: parseInt(result.rows[0].count),
      message: `User has ${result.rows[0].count} wallet(s)`,
    });
  } catch (error) {
    console.error("API Error:", error);
    res.status(500).json({
      error: "Internal server error",
      details: error.message,
    });
  }
});

// Get all users (admin endpoint - optional)
app.get("/api/users", async (req, res) => {
  try {
    const query = `
      SELECT
        email,
        COUNT(*) as wallet_count,
        MIN(created_at) as first_wallet,
        MAX(created_at) as latest_wallet
      FROM wallets
      GROUP BY email
      ORDER BY latest_wallet DESC
    `;

    const result = await pool.query(query);

    res.json({
      success: true,
      data: result.rows,
      totalUsers: result.rows.length,
      message: `Found ${result.rows.length} users`,
    });
  } catch (error) {
    console.error("API Error:", error);
    res.status(500).json({
      error: "Internal server error",
      details: error.message,
    });
  }
});

// User statistics endpoint
app.get("/api/stats", async (req, res) => {
  try {
    const queries = await Promise.all([
      pool.query("SELECT COUNT(DISTINCT email) as total_users FROM wallets"),
      pool.query("SELECT COUNT(*) as total_wallets FROM wallets"),
      pool.query(`
        SELECT COUNT(*) as wallets_today
        FROM wallets
        WHERE created_at >= CURRENT_DATE
      `),
      pool.query(`
        SELECT COUNT(*) as wallets_this_week
        FROM wallets
        WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'
      `),
    ]);

    const stats = {
      totalUsers: parseInt(queries[0].rows[0].total_users),
      totalWallets: parseInt(queries[1].rows[0].total_wallets),
      walletsToday: parseInt(queries[2].rows[0].wallets_today),
      walletsThisWeek: parseInt(queries[3].rows[0].wallets_this_week),
    };

    res.json({
      success: true,
      data: stats,
      message: "Statistics retrieved successfully",
    });
  } catch (error) {
    console.error("API Error:", error);
    res.status(500).json({
      error: "Internal server error",
      details: error.message,
    });
  }
});
