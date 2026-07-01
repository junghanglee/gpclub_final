# GPCLUB Vietnam Admin User Manual

Version: Final admin workflow reference
Audience: GPCLUB Vietnam administrators and content operators
Admin URL: `/admin`
Login URL: `/auth`
Public check URLs: `/`, `/products`, `/catalog`, `/events`, `/contact`

---

## 1. Purpose of the Admin Panel

The GPCLUB admin panel is used to manage the public Vietnam website without editing code. Admin users can update homepage content, product information, downloadable catalogs, B2B inquiries, chatbot knowledge, events, popups, FAQs, and company contact settings.

Use the admin panel when you need to:

- Publish or hide products shown on the website.
- Create product catalogs for B2B partners.
- Review dealer applications and customer inquiries.
- Update homepage and brand/page text.
- Add events, new product announcements, popups, and FAQs.
- Maintain chatbot answers, documents, and scenario buttons.
- Update company contact information.

---

## 2. Login and Access

1. Open the admin login page: `/auth`.
2. Sign in with an authorized admin account.
3. After successful login, the system opens `/admin`.
4. If your account is not approved as an admin, the page shows an access denied message.
5. Use the language selector at the top-right of the admin screen to switch the admin interface language.
6. Use **Sign out** when you finish working.

Important:

- Do not share admin accounts.
- If login works but `/admin` is blocked, the account needs the `admin` role.
- The admin panel saves data to Supabase, so wait for the save success message before closing the page.

---

## 3. Admin Menu Structure

The admin panel has five main areas:

1. **Dashboard**
2. **Product Management**
   - Products
   - Catalog Management
3. **Customer Management**
   - Dealers
   - Contacts
4. **Content Management**
   - Home
   - Events
   - Popups
   - FAQs
   - Chatbot
5. **Settings**

---

## 4. Dashboard

The Dashboard gives a quick operational overview.

You can check:

- Dealer applications count.
- New/unhandled dealer applications.
- General inquiries count.
- Published FAQs count.
- Popups count.
- Events count.
- Chatbot training entries count.

How to use:

1. Open **Dashboard**.
2. Review the summary cards.
3. Click **Refresh** to reload the latest data.

Recommended routine:

- Check the dashboard at the start of each working day.
- If new dealer applications or inquiries exist, go to **Customer Management**.

---

## 5. Product Management > Products

This section controls products shown on the homepage, product list page, and product detail pages.

Public pages affected:

- `/`
- `/products`
- `/products/{productId}`
- `/catalog`
- `/catalog/{catalogId}`

### 5.1 Product List

The product table shows:

- Published status.
- Brand name.
- Product name.
- Product type.
- Status badges such as Live, Draft, Featured.
- Edit and delete buttons.

Available actions:

- Search by product name, brand, type, or intro text.
- Filter by brand.
- Toggle product publish status.
- Quickly edit product name and product type directly in the table.
- Open the full edit popup.
- Delete a product.

### 5.2 Add a New Product

1. Go to **Product Management > Products**.
2. Click **New Product**.
3. Fill in the required product information.
4. Turn on/off the status switches.
5. Add detail content, media, and conditions.
6. Click **Save**.
7. Confirm the product on `/products`.

### 5.3 Product Fields

Main fields:

- **Brand Name**: Product brand, for example JMsolution, JMella, or Trois Touch.
- **Product Name**: Full product name shown to users.
- **Product Type**: Category such as Sheet Mask, Skincare, Body Care, Hair Care, Makeup, Fragrance.
- **Order / Sort Order**: Higher numbers appear first.
- **Short Intro**: Short summary shown on cards.
- **Cover Image**: Main image URL.

Status switches:

- **Published**: If on, the product is visible to visitors.
- **New Product**: Adds a new product badge.
- **Popular Product**: Marks the product as popular.
- **Featured Product**: Highlights the product in key sections.

Detail content:

- Use the detail editor to add product descriptions, benefits, usage notes, or HTML-formatted information.
- Keep product descriptions clear and B2B-friendly.

Media:

- Add image or media URLs.
- Use stable public URLs.
- Add alt text when possible.

Conditions:

- Use conditions for sale-facing information such as price notes, MOQ, lead time, or availability.
- Hide sensitive or internal-only conditions by turning visibility off if the UI provides the option.

### 5.4 Product Publishing Checklist

Before publishing:

- Product name is correct.
- Brand name is correct and consistent.
- Product type is accurate.
- Cover image URL works.
- Short intro is not too long.
- Detail information is accurate.
- Published switch is on only when the product is ready.
- Check the product on desktop and mobile.

---

## 6. Product Management > Catalog Management

Catalog Management creates B2B product catalogs from products already registered in Product Management.

Public pages affected:

- `/catalog`
- `/catalog/{catalogId}`
- Homepage catalog download link when a representative catalog is selected.

### 6.1 Catalog List

The catalog list shows:

- Catalog title.
- Template type.
- Number of selected products.
- Representative catalog status.
- Preview/download/edit/delete actions.

### 6.2 Create a Catalog

1. Go to **Product Management > Catalog Management**.
2. Click **New Catalog**.
3. Enter catalog title, subtitle, and description.
4. Choose a template:
   - **Premium**: Best for polished B2B presentations.
   - **Compact**: Best for shorter product lists.
   - **Lineup**: Best for product lineup comparison.
5. Select products to include.
6. Optionally mark the catalog as **Representative Catalog**.
7. Click **Save**.
8. Click Preview or open `/catalog/{catalogId}` to check the catalog.

### 6.3 Representative Catalog

The representative catalog is the main catalog linked from the website.

Rules:

- Only one catalog should be representative.
- If you set a new catalog as representative, it replaces the previous representative catalog.
- Use the representative catalog for the current official B2B product portfolio.

### 6.4 Catalog Checklist

Before sharing a catalog:

- All selected products are published and accurate.
- Product order is logical.
- Catalog title and subtitle are professional.
- Template matches the purpose.
- Preview page opens correctly.
- Mobile layout is readable.

---

## 7. Customer Management > Dealers

This section manages B2B dealer applications submitted through the website.

Data source:

- Dealer application form submissions.

The dealer table shows:

- Company.
- Contact person.
- City.
- Monthly volume.
- Status.
- Submission date.

### 7.1 Review a Dealer Application

1. Go to **Customer Management > Dealers**.
2. Find the application in the table.
3. Click **View**.
4. Review company, position, city, channel, monthly volume, brands, contact name, email, phone, and message.
5. Add an internal admin note if needed.
6. Change the status.
7. Save the note.

### 7.2 Recommended Status Workflow

Use status values consistently:

- **New**: Newly received, not reviewed yet.
- **In Progress / Reviewing**: The team is checking the application.
- **Contacted**: The team has contacted the applicant.
- **Approved**: Accepted as a potential partner/dealer.
- **Rejected / Closed**: Not proceeding or completed.

Operational tips:

- Always leave a short admin note after calling or emailing the applicant.
- Do not delete applications unless they are spam or duplicate records.
- Keep personal information confidential.

---

## 8. Customer Management > Contacts

This section manages chatbot/contact records and general inquiries.

You can:

- Review customer messages.
- Filter or group inquiry records.
- Update inquiry status.
- Delete spam or duplicate records.

Recommended workflow:

1. Go to **Customer Management > Contacts**.
2. Review new messages first.
3. Update the status after handling.
4. Keep important records for future reference.
5. Delete only spam or incorrect duplicate records.

---

## 9. Content Management > Home

This section edits homepage content and selected page text.

Public pages affected:

- `/`
- Brand/page content depending on selected page.

### 9.1 Select Page to Edit

1. Go to **Content Management > Home**.
2. Use **Page to Edit**.
3. Select **Home** or another editable page.
4. Edit the fields.
5. Click **Save Home**.
6. Check the public page.

### 9.2 Homepage Editable Areas

Homepage areas include:

- Hero section.
- Hero statistics.
- Partner hook section.
- Trust section.
- Process section.
- Image URLs and image alt text.
- CTA text.

Common fields:

- **Kicker**: Small headline above the title.
- **Title**: Main heading.
- **Subtitle**: Supporting description.
- **Primary CTA**: Main button text.
- **Secondary CTA**: Secondary button text.
- **Image URL**: Public image address.
- **Image Alt**: Text description of the image.

### 9.3 Reset and Reload

- **Reload**: Reloads saved data from the database.
- **Reset**: Resets the editor to default content. Use carefully.
- **Save Home**: Saves the current edited content.

Important:

- Reset does not become public until you save, but it can overwrite your current editor content.
- Always check the public homepage after saving.

---

## 10. Content Management > Events

This section manages events and new product announcement posts.

Public page affected:

- `/events`

### 10.1 Event List

The event table shows:

- Title in English and Vietnamese.
- Content type.
- Media type.
- Date.
- Featured status.
- Published switch.

### 10.2 Add an Event or New Product Post

1. Go to **Content Management > Events**.
2. Click **New Event**.
3. Choose content type:
   - **Event**
   - **New Product Spotlight**
4. Enter Vietnamese and English titles.
5. Enter Vietnamese and English summaries.
6. Enter body content if needed.
7. Add media URL and media type.
8. Add CTA label and CTA URL if needed.
9. Set event date, sort order, featured, and published status.
10. Click **Save**.
11. Check `/events`.

Required fields:

- Vietnamese title.
- English title.

Publishing tips:

- Use **Featured** for high-priority announcements.
- Use **Published** only after both languages are reviewed.
- Use a clear media URL for event images or videos.

---

## 11. Content Management > Popups

This section manages promotional or notice popups shown to website visitors.

### 11.1 Popup List

Each popup card shows:

- Image preview if available.
- Title.
- Priority.
- Content preview.
- Schedule period.
- Status: Live, Scheduled, Expired, or Off.
- Active switch.

### 11.2 Create a Popup

1. Go to **Content Management > Popups**.
2. Click **New Popup**.
3. Enter title and content.
4. Add image URL if needed.
5. Add CTA label and CTA URL if the popup should link somewhere.
6. Set start and end time if the popup is scheduled.
7. Set priority. Higher priority appears first.
8. Turn **Active** on.
9. Click **Save**.
10. Check the public website.

Important:

- A popup may be active but not visible if the start time is in the future or the end time has passed.
- Use popups sparingly so they do not disturb visitors.
- Delete expired popups only after confirming they are no longer needed.

---

## 12. Content Management > FAQs

This section manages public FAQ content.

### 12.1 Language Filters

FAQ records are filtered by language tabs such as Korean, English, and Vietnamese.

The FAQ table shows:

- Question.
- Category.
- Sort order.
- Published status.
- Edit/delete actions.

### 12.2 Add an FAQ

1. Go to **Content Management > FAQs**.
2. Select the language filter you want to manage.
3. Click **New FAQ**.
4. Enter question and answer.
5. Enter category.
6. Set sort order.
7. Turn **Published** on when ready.
8. Click **Save**.
9. Check the public FAQ area if connected on the website.

Required fields:

- Question.
- Answer.

Tips:

- Keep answers short and practical.
- Use categories consistently.
- Higher or lower sort behavior depends on the page display; check the public page after saving.

---

## 13. Content Management > Chatbot

This section manages chatbot knowledge, document library, and tree/button scenarios.

The chatbot area has four major functions:

1. Training entries.
2. Product information entries.
3. Document library.
4. Tree mode scenarios.

### 13.1 Training Entries: Q&A

Use Q&A entries for approved exact answers.

How to add:

1. Go to **Content Management > Chatbot**.
2. Click **New Training Entry** in the Q&A area.
3. Enter question and answer.
4. Add tags if needed.
5. Keep **Enabled** on.
6. Click **Save**.

Use for:

- Common customer questions.
- Official company answers.
- Short policy explanations.

### 13.2 Product Info Entries

Use product info entries for product facts, benefits, skin concerns, and recommendations.

How to add:

1. Click **Product Info**.
2. Enter title and product content.
3. Add tags.
4. Keep **Enabled** on.
5. Click **Save**.

Recommended content:

- Product name.
- Brand.
- Main benefits.
- Recommended customer type.
- Usage notes.
- B2B notes if relevant.

### 13.3 Document Library

The document library stores longer documents and automatically processes them into chunks.

Document fields:

- Title.
- Description.
- Raw content.
- Language.
- Category.
- Source type.
- File URL.
- Status.
- Enabled.
- Version.
- Tags.

How to add a document:

1. Click **New Document**.
2. Enter title and raw content.
3. Choose language and category.
4. Add tags if useful.
5. Click **Save**.
6. The system processes the document into chunks.
7. Use preview/chunks view to confirm processing.

Important:

- Title and raw content are required.
- After saving, wait for processing to complete.
- If content is updated, save again so chunks are regenerated.

### 13.4 Tree Mode Scenarios

Tree mode creates button-based chatbot flows.

Fields:

- Scenario key.
- Parent ID.
- Sort order.
- Button labels in Korean, English, Vietnamese.
- Answers in Korean, English, Vietnamese.
- Action type.
- Linked training ID.
- Linked document ID.
- Enabled.

How to create a scenario button:

1. Click **Tree Scenario**.
2. Enter a scenario key, for example `default`.
3. Enter button labels in at least one language.
4. Enter answers or link to a training/document item.
5. Set sort order.
6. Keep **Enabled** on.
7. Click **Save**.

Tips:

- Use short button labels.
- Keep scenario keys consistent.
- Use parent ID only when creating nested flows.
- Test the chatbot after changing tree scenarios.

---

## 14. Settings

Settings controls company contact information used across the website.

Public areas affected may include:

- Header/footer contact information.
- Contact page.
- CTA links.

How to update:

1. Go to **Settings**.
2. Edit the contact fields.
3. Click **Save Changes**.
4. Check the footer and contact page.

Important:

- Keep phone numbers, email, address, Zalo, and WhatsApp information accurate.
- Use full URLs for external links where possible.
- Do not enter private internal contact information unless it should be public.

---

## 15. Save, Publish, and Verify

After every change:

1. Click the correct save button.
2. Wait for the success message.
3. Open the public page in a new tab.
4. Refresh the browser.
5. Check desktop and mobile layout.
6. Confirm English and Vietnamese text if the content is bilingual.

Recommended public checks:

- Homepage: `/`
- Products: `/products`
- Product detail: `/products/{productId}`
- Catalog list: `/catalog`
- Catalog detail: `/catalog/{catalogId}`
- Events: `/events`
- Contact: `/contact`

---

## 16. Content Quality Rules

Use these rules for all admin work:

- Keep English and Vietnamese meanings consistent.
- Do not publish machine translation without review.
- Use clear B2B wording.
- Avoid very long titles.
- Use high-quality image URLs.
- Check mobile readability after content changes.
- Do not publish unconfirmed prices, claims, certifications, or partnership statements.
- Keep internal notes and customer personal information private.

---

## 17. Troubleshooting

### Login fails

- Check email and password.
- Try the login page again: `/auth`.
- If login succeeds but admin access is denied, ask the system manager to check the admin role.

### Saved content does not appear publicly

- Confirm you clicked Save.
- Refresh the public page.
- Check whether Published or Active is turned on.
- For scheduled popups, check start and end time.
- For products, check the Published switch.

### Image does not appear

- Confirm the image URL is public.
- Open the image URL directly in a browser.
- Use HTTPS URLs when possible.

### Catalog does not show expected products

- Confirm the products are selected in the catalog.
- Confirm selected products exist in Product Management.
- Confirm product content is published if it should appear publicly.
- Check `/catalog/{catalogId}`.

### Chatbot document changes do not work

- Save the document again.
- Wait for processing to complete.
- Check generated chunks.
- Confirm the document is enabled and active.

---

## 18. Daily Admin Checklist

Daily:

- Check Dashboard.
- Review new dealer applications.
- Review new contact/chatbot records.
- Confirm no expired urgent popup remains active.

Weekly:

- Review published products.
- Review representative catalog.
- Check events and new product announcements.
- Review chatbot Q&A and document library.

Before major campaign launch:

- Check homepage hero and CTA.
- Check product cards and product detail pages.
- Check catalog download/preview.
- Check popup schedule.
- Check event post.
- Check contact information.
- Test mobile layout.

---

## 19. Safety Notes

- Deleting records is usually permanent. Delete only when necessary.
- Do not enter confidential prices or internal business terms into public fields.
- Do not share customer personal information outside authorized staff.
- Do not publish legal, certification, or performance claims unless approved.
- For important updates, take a screenshot after public verification.
