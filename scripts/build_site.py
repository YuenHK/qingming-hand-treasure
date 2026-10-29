"""Verify every runtime file and copy only the static website to dist/."""
from pathlib import Path
import hashlib
import json
import shutil

root=Path(__file__).resolve().parents[1]
manifest=json.loads((root/'site-files.json').read_text(encoding='utf-8'))
destination=root/'dist'
for name,expected in manifest.items():
    source=(root/name).resolve()
    if not source.is_relative_to(root) or source.is_symlink():
        raise ValueError('Unsafe path: '+name)
    if hashlib.sha256(source.read_bytes()).hexdigest()!=expected:
        raise ValueError('File differs from manifest: '+name)
    target=destination/name;target.parent.mkdir(parents=True,exist_ok=True)
    shutil.copy2(source,target)
print(f'Built {len(manifest)} verified static files in dist/')
