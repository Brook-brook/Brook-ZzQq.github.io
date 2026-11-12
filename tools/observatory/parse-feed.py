"""Bounded RSS 2.0/RSS 1.0/Atom metadata parser. No article body leaves this process."""
import json
import re
import sys
import xml.etree.ElementTree as ET
from datetime import datetime, timezone
from email.utils import parsedate_to_datetime

MAX_BYTES = 2 * 1024 * 1024


def local(tag):
    return tag.rsplit('}', 1)[-1]


def text(node, name):
    child = next((entry for entry in node if local(entry.tag) == name), None)
    return ''.join(child.itertext()).strip() if child is not None else ''


def stamp(raw):
    try:
        try:
            value = datetime.fromisoformat(raw.replace('Z', '+00:00'))
        except ValueError:
            value = parsedate_to_datetime(raw)
        if value.tzinfo is None:
            return None
        return value.astimezone(timezone.utc).isoformat(timespec='milliseconds').replace('+00:00', 'Z')
    except (ValueError, TypeError, OverflowError):
        return None


def parse(data):
    if len(data) > MAX_BYTES:
        raise ValueError('too_large')
    if b'\x00' in data:
        raise ValueError('unsupported_encoding')
    if re.search(br'<!\s*(DOCTYPE|ENTITY)\b', data, re.I):
        raise ValueError('unsafe_xml')
    root = ET.fromstring(data)
    if local(root.tag) not in ('rss', 'RDF', 'feed'):
        raise ValueError('unsupported_feed')
    entries = [node for node in root.iter() if local(node.tag) in ('item', 'entry')]
    if len(entries) > 3000:
        raise ValueError('entry_limit')
    output = []
    for entry in entries:
        atom = local(entry.tag) == 'entry'
        url = ''
        if atom:
            links = [node for node in entry if local(node.tag) == 'link' and node.get('rel', 'alternate') == 'alternate']
            preferred = next((node for node in links if node.get('type', 'text/html') == 'text/html'), None)
            chosen = preferred if preferred is not None else (links[0] if links else None)
            url = chosen.get('href', '') if chosen is not None else ''
        else:
            url = text(entry, 'link')
        published = (text(entry, 'published') if atom else text(entry, 'pubDate') or text(entry, 'date'))[:200]
        updated = text(entry, 'updated')[:200]
        output.append({
            'title': text(entry, 'title')[:4000], 'url': url[:4096],
            'published_raw': published, 'updated_raw': updated,
            'published_iso': stamp(published), 'updated_iso': stamp(updated)
        })
    return output


if __name__ == '__main__':
    try:
        data = sys.stdin.buffer.read(MAX_BYTES + 1)
        print(json.dumps(parse(data), ensure_ascii=False))
    except (ValueError, ET.ParseError, RecursionError):
        print(json.dumps({'error': 'invalid_feed'}))
        sys.exit(1)
