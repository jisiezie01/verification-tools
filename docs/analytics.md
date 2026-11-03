# See which guides and tools people use

The website sends events to the existing Google Analytics 4 web stream with measurement ID **G-E0HDVB3SYT**. The code is configured locally; publish the updated site before expecting these new events from visitors. The GA4 property settings below must be configured separately by someone with access to that property.

## 1. Register the names you want in reports

In the property associated with this measurement ID, open **Admin → Data display → Custom definitions → Create custom dimensions**. For each row below, use **Scope: Event**, enter the event parameter exactly, and save. If a definition already exists, reuse it. You need Editor or Administrator access. [Google's custom-dimension instructions](https://support.google.com/analytics/answer/14239696).

| Dimension name | Event parameter | What you can group by |
| --- | --- | --- |
| Guide title | `guide_title` | The guide page; currently Building guide |
| Guide section | `guide_section` | Rental-history dates, repeated fields, salary calculations, etc. |
| Guide target | `guide_target` | The section or destination that was clicked |
| Tool name | `tool_name` | Formatter, Calculator, and other saved tools |
| Tool action | `tool_action` | generate, copy, or reset |
| Tool category | `tool_category` | The tool's category |

Optional dimensions for more detail: **Guide ID** (`guide_id`), **Guide section ID** (`guide_section_id`), **Guide link text** (`guide_link_text`), **Guide click source** (`guide_click_source`), **Tool ID** (`tool_id`), **Tool category ID** (`tool_category_id`), and **Tool source** (`tool_source`). Tool source distinguishes the category workspace from a standalone tool page. Stable IDs help combine results if names change.

**Event name**, **Event count**, and **Total users** already exist in Analytics. Do not recreate them as custom definitions. Custom dimensions can take 24–48 hours to become available after registration and incoming data. [Google's availability guidance](https://support.google.com/analytics/answer/14239696).

## 2. Build the reports

Open **Explore → Free form**. Import the relevant dimensions and the **Event count** metric in the Variables panel. Place them in Rows, Columns, and Values as shown below. Add **Total users** if you also want the number of people. Set a date range that includes activity after deployment, then sort Event count from highest to lowest. [Google's exploration instructions](https://support.google.com/analytics/answer/9327972).

Create a separate exploration tab for each question:

| Question | Rows | Columns | Values | Event name filter |
| --- | --- | --- | --- | --- |
| Which guide pages are viewed? | Guide title | None | Event count | Exactly matches `guide_view` |
| Which guide topics are viewed? | Guide section | None | Event count | Exactly matches `guide_section_view` |
| What do people click in the guide? | Guide target | None | Event count | Exactly matches `guide_click` |
| Which tools are viewed most? | Tool name | None | Event count | Exactly matches `tool_view` |
| Which tool buttons are clicked most? | Tool name | Tool action | Event count | Exactly matches `tool_action_click` |
| Which tools are actively used? | Tool name | None | Event count | Exactly matches `tool_use` |
| How many actions finish successfully? | Tool name | Event name | Event count | Matches regex `^tool_(generate\|copy\|reset)$` |

In the last row's regex, enter vertical bars without backslashes: `^tool_(generate|copy|reset)$`.

For the clicks report, use Guide link text as an additional row if you registered it. A target such as `section:rental-history` means someone clicked a link to that topic. `workspace`, `builder`, and `manage_tools` indicate navigation into the app. Guide click source tells you whether the link came from the contents menu, article, or other navigation.

## 3. Understand what a count means

| Event | Meaning |
| --- | --- |
| `guide_view` | The guide intersects the viewport for one continuous second while the tab is visible. Once per page load. |
| `guide_section_view` | A section heading is visible for one continuous second. Once per section per page load. This is an impression, not proof that the whole section was read. |
| `guide_click` | A guide link is activated, including contents links and links to the workspace. Every activation counts. |
| `tool_view` | Some of the tool is visible for one continuous second. Once while that tool remains mounted; reopening it can count again. A long tool does not need to fit entirely on screen. |
| `tool_action_click` | A Generate, Copy, or Reset control is activated. Includes attempts that fail. Keyboard activation counts too. |
| `tool_generate` | Generate completes successfully. One event per activation, even if it generates several outputs. |
| `tool_copy` | Copy succeeds. Includes paired input Copy buttons. A denied clipboard write does not count. |
| `tool_reset` | Reset runs. |
| `tool_use` | First changed input, successful Generate, or successful Copy in a use cycle. Reset starts a new cycle. |

Use **Event count** to compare activity and **Total users** to compare people. Repeated clicks increase Event count. Do not add click events and successful-action events together as one total: a successful click produces both.

The documentation currently has one guide page with several sections. Page views alone cannot tell you which sections attracted attention; use the section report. Likewise, Calculator is one saved tool even though it contains Salary, RH, and other choices. Tool reports group actions under Calculator, not under each internal radio choice.

Tool and guide custom events contain names, IDs, and action/navigation labels. They do not include entered names, phone numbers, addresses, input values, generated notes, templates, or clipboard content. Standard Google-tag page events operate separately.

## 4. Verify after publishing

1. Open the published guide, leave the tab visible, and pause at a section heading for at least one second. Click a contents link and then Open workspace.
2. View a tool, fill it with sample values, and use Generate, Copy, and Reset.
3. In **Reports → Realtime**, look for the event names above. Select an event to inspect its parameters. [Google's event verification guide](https://support.google.com/analytics/answer/9322688).
4. For device-specific troubleshooting, connect the published URL using [Google Tag Assistant](https://tagassistant.google.com/), then open **Admin → Data display → DebugView**. Debug mode must be enabled for your device; the site does not enable it for all visitors. [Google's DebugView instructions](https://support.google.com/analytics/answer/7201382).

No extra GA4 “Create event” rules or Tag Manager click tags are needed for these events: the site sends them directly. Additional tags for the same actions would inflate the counts. You do not need to mark them as key events just to report on them.

These new measurements start after deployment; they cannot reconstruct previous guide reads or button clicks. Blocking analytics, disabling JavaScript, or denying analytics access can result in fewer recorded events than actual activity. Development mode disables the custom events. Production preview enables them, so use blocked Google requests or a mocked tag for automated testing.

## Maintainer verification

`npm run test:analytics-unit` checks metadata, missing-tag resilience, view timing, hidden-tab behavior, and guide navigation without sending anything to Google. The existing `npm run test:analytics-browser` checks production tool wiring and guide navigation with Google requests blocked; it requires an isolated debugging browser on port 9223 and a current production build.
