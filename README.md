# images-resizer.com

Free online image tools — resize, compress, crop and convert images entirely in the browser (no server-side processing).

Static site deployed on Vercel. Pages are generated from templates in `_gen/` (Python):

```
cd _gen && python3 gen_tools.py && python3 gen_content.py
```
