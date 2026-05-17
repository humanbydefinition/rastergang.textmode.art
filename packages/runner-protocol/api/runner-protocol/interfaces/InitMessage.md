---
layout: doc
editLink: true
---

[@textmode/runner-protocol](../index.md) / InitMessage

# Interface: InitMessage

Initial window message sent by a host app to the runner iframe.

## Properties

| Property | Type | Description |
| ------ | ------ | ------ |
| <a id="property-type"></a> `type` | `"INIT"` | - |
| <a id="property-client"></a> `client` | `"editor"` \| `"synth"` | Host app family initiating the connection. |
