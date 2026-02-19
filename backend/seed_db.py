import sqlite3

conn = sqlite3.connect("toby_site.db")
c = conn.cursor()

# Seed mock video data
c.execute("INSERT OR IGNORE INTO videos (id, title, thumbnail, published_at, is_live) VALUES ('v1', 'Garmin Epix Gen 3 Review', 'https://via.placeholder.com/640x360', '2026-02-18', 0)")
c.execute("INSERT OR IGNORE INTO videos (id, title, thumbnail, published_at, is_live) VALUES ('v2', 'Live: Q&A Tech Talk', 'https://via.placeholder.com/640x360', '2026-02-20', 1)")

# Seed mock blog data
c.execute("INSERT OR IGNORE INTO posts (title, content, status, created_at) VALUES ('Welcome to the new site', 'This is the first post on the new platform.', 'published', '2026-02-18')")
c.execute("INSERT OR IGNORE INTO posts (title, content, status, created_at) VALUES ('AI Generated Draft: Why HRV Matters', 'Heart Rate Variability is key...', 'draft', '2026-02-18')")

conn.commit()
conn.close()
print("Database seeded.")
