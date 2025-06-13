import { neon } from "@neondatabase/serverless"

// This script will create the brands table in your Neon database
async function setupDatabase() {
  try {
    // Replace with your actual DATABASE_URL and add the configuration
    const sql = neon(process.env.DATABASE_URL || "postgresql://user:password@localhost:5432/database", {
      disableWarningInBrowsers: true,
    })

    console.log("Creating brands table...")

    await sql`
      CREATE TABLE IF NOT EXISTS brands (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        website VARCHAR(255),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `

    console.log("Inserting sample data...")

    // Insert some sample data
    await sql`
      INSERT INTO brands (name, description, website)
      VALUES 
        ('Apple', 'Technology company that designs, develops, and sells consumer electronics, computer software, and online services.', 'https://www.apple.com'),
        ('Nike', 'American multinational corporation that designs, develops, manufactures, and markets footwear, apparel, equipment, accessories, and services.', 'https://www.nike.com'),
        ('Tesla', 'American electric vehicle and clean energy company.', 'https://www.tesla.com')
      ON CONFLICT (id) DO NOTHING
    `

    console.log("Database setup complete!")
  } catch (error) {
    console.error("Error setting up database:", error)
  }
}

setupDatabase()
