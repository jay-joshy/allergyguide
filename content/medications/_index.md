+++
template = "pages.html"
+++
<br>
{% admonition(type="info", icon="tip", title="Quickly find meds by") %}
Using the searchbar below +/- the additive filter buttons. Clear filters by clicking "All." Or, just <kbd><kbd>Ctrl-F</kbd></kbd>.
{% end %}
<br>
{{medications_toml_load(filter = true)}}
