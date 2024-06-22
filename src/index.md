---
title: Table of Content
layout: "base.njk"
---

~~Hello Jamstack fam! But wait, who is Jamstack?~~



This is a minimalist website built on eleventy.



{% for post in collections.post %}
- [{{ post.data.title }} ({{ post.date.toString() }})]({{ post.page.url }})
{% endfor %}

