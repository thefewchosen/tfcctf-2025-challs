from flask import Flask, render_template, request, redirect, url_for, session, jsonify, make_response
from functools import wraps
from threading import Thread
import os
import secrets
import bot

app = Flask(__name__)
app.secret_key = secrets.token_hex(32)
ADMIN_USERNAME = secrets.token_hex(32)
ADMIN_PASSWORD = secrets.token_hex(32)
print(f"[SERVER] Admin credentials: {ADMIN_USERNAME}:{ADMIN_PASSWORD}")
FLAG = os.getenv("FLAG", "default_flag_value")

users = {ADMIN_USERNAME: ADMIN_PASSWORD}
posts = [{
    "id": 0,
    "author": ADMIN_USERNAME,
    "title": "FLAG",
    "description": FLAG,
    "hidden": True
}]

def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if "username" not in session:
            return redirect(url_for("login"))
        return f(*args, **kwargs)
    return decorated_function

@app.route("/")
@login_required
def index():
    visible_posts = [
        post for post in posts
        if not post.get("hidden", False) or post["author"] == session["username"]
    ]
    return render_template("index.html", posts=visible_posts, username=session["username"])

@app.route("/login", methods=["GET", "POST"])
def login():
    if "username" in session:
        return redirect(url_for("index"))

    username = request.args.get("username") or request.form.get("username")
    password = request.args.get("password") or request.form.get("password")

    if username and password:
        if username in users and users[username] == password:
            session["username"] = username
            return redirect(url_for("index"))
        return render_template("invalid.html", user=username), 401

    return render_template("login.html")

@app.route("/register", methods=["GET", "POST"])
def register():
    if "username" in session:
        return redirect(url_for("index"))
    if request.method == "POST":
        username = request.form["username"]
        password = request.form["password"]
        if username in users:
            return "User already exists", 400
        users[username] = password
        session["username"] = username
        return redirect(url_for("index"))
    return render_template("register.html")

@app.route("/logout")
@login_required
def logout():
    session.pop("username", None)
    return redirect(url_for("login"))

@app.route("/create_post", methods=["POST"])
@login_required
def create_post():
    title = request.form["title"]
    description = request.form["description"]
    hidden = request.form.get("hidden") == "on"  # Checkbox in form for hidden posts
    post_id = len(posts)
    posts.append({
        "id": post_id,
        "author": session["username"],
        "title": title,
        "description": description,
        "hidden": hidden
    })
    return redirect(url_for("index"))

@app.route("/post/<int:post_id>")
@login_required
def post_page(post_id):
    """Render a single post fully server-side (no client JS) with strict CSP."""
    post = next((p for p in posts if p["id"] == post_id), None)
    if not post:
        return "Post not found", 404
    if post.get("hidden") and post["author"] != session["username"]:
        return "Unauthorized", 403

    resp = make_response(render_template("post.html", post=post))
    resp.headers["Content-Security-Policy"] = "script-src 'none'; style-src 'self'"
    return resp


def _run_admin_bot(target_url: str):
    try:
        bot.run_report(target_url, ADMIN_USERNAME, ADMIN_PASSWORD)
        print("[BOT] Done")
    except Exception as e:
        print(f"[BOT] Error: {e}")

@app.route('/report', methods=['POST'])
def report():
    url = request.form.get('url')
    if not url:
        return 'Missing url', 400
    Thread(target=_run_admin_bot, args=(url,), daemon=True).start()
    return 'Report queued', 202

if __name__ == "__main__":
    app.run(host='0.0.0.0', debug=False)
