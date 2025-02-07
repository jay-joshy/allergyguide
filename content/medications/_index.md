+++
template = "pages.html"
+++
<br>
{% admonition(type="info", icon="tip", title="Quickly find meds by") %}
<kbd><kbd>Ctrl-F</kbd></kbd> or the additive filter buttons. Clear filters by clicking "All".
{% end %}
<br>
{{medications_toml_load(filter = true)}}
