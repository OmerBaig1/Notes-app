from flask import Flask, request, jsonify, render_template
import sqlite3

app = Flask(__name__)
DB_NAME = "notes.db"

# --- Setting Up Database--
def init_db():
    conn = sqlite3.connect(DB_NAME)
    conn.execute("""
        CREATE TABLE IF NOT EXISTS notes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            content TEXT,
            color TEXT DEFAULT '#fafafa',
            due_date TEXT
        )
    """)
    conn.commit()
    conn.close()

def get_db_connection():
    conn = sqlite3.connect(DB_NAME)
    conn.row_factory = sqlite3.Row  #Accesses columns by name
    return conn

# --- Routes ---

@app.route("/")
def home():
    return render_template("index.html")

#CREATE + READ all notes
@app.route("/notes", methods=["GET", "POST"])
def notes():
    conn = get_db_connection()
    if request.method == "POST":
        data = request.get_json()
        conn.execute(
            "INSERT INTO notes (title, content, color, due_date) VALUES (?, ?, ?, ?)",
            (data["title"], data.get("content", ""), data.get("color", "#fafafa"), data.get("due_date"))
        )
        conn.commit()
        conn.close()
        return jsonify({"status": "success"}), 201

    # GET request — return all notes
    notes = conn.execute("SELECT * FROM notes").fetchall()
    conn.close()
    return jsonify([dict(note) for note in notes])

#UPDATE and DELETE a specific note
@app.route("/notes/<int:note_id>", methods=["PUT", "DELETE"])
def note(note_id):
    conn = get_db_connection()
    if request.method == "PUT":
        data = request.get_json()
        conn.execute(
            "UPDATE notes SET title = ?, content = ?, color = ?, due_date = ? WHERE id = ?",
            (data["title"], data.get("content", ""), data.get("color", "#fafafa"), data.get("due_date"), note_id)
        )
        conn.commit()
        conn.close()
        return jsonify({"status": "updated"})

    if request.method == "DELETE":
        conn.execute("DELETE FROM notes WHERE id = ?", (note_id,))
        conn.commit()
        conn.close()
        return jsonify({"status": "deleted"})

if __name__ == "__main__":
    init_db()
    app.run(debug=True)