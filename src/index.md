---
title: Hello World
layout: "base.njk"
---

Hello Jamstack fam! But wait, who is Jamstack?

{% for post in collections.post %}
- [{{ post.data.title }} ({{ post.date.toString() }})]({{ post.url }})
{% endfor %}

