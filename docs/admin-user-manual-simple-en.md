# GPCLUB Admin Manual for New Operators

This guide is written for operators who are not familiar with technical systems. Follow each step in order. No coding knowledge is required.

- Admin login page: /auth
- Admin page: /admin
- Public pages to check after saving: /, /products, /catalog, /events, /contact

## 1. The Most Important Rule

1. Edit content in the admin panel.
2. Click Save.
3. Wait for the success message.
4. Open the public page and check the result.
5. Also check on mobile or a small screen.

Do not close the browser immediately after clicking Save. Wait until the system confirms that the content has been saved.

## 2. Login

1. Open /auth.
2. Enter the admin email and password.
3. After login, open /admin.
4. If access is denied, ask the system manager to give the account the admin role.
5. Click Sign out when finished.

Do not share admin passwords through chat or group email.

## 3. Understanding the Admin Menu

Dashboard shows the current status.

Product Management is for products and catalogs.

Customer Management is for dealer applications and contact messages.

Content Management is for homepage content, events, popups, FAQs, and chatbot data.

Settings is for company contact information.

If you are unsure where to start, check Dashboard first.

## 4. Dashboard: Daily Check

Open Dashboard to review new activity.

Check these items:

- New dealer applications.
- New contact messages.
- Running popups or events.
- Chatbot data that may need updates.

If new numbers appear, move to Customer Management.

## 5. Products: Add or Edit Products

Use this section when adding a new product or changing product information.

Steps to add a product:

1. Go to Product Management > Products.
2. Click New Product.
3. Enter Brand Name, Product Name, and Product Type.
4. Enter a short and clear Short Intro.
5. Add the Cover Image using a public image URL.
6. Add details, benefits, and usage notes if needed.
7. Turn Published on when the product is ready for the public website.
8. Click Save.
9. Open /products and check the result.

Common switches:

- Published: shows the product on the website.
- New Product: marks it as new.
- Popular Product: marks it as popular.
- Featured Product: highlights it in important areas.

Before turning Published on, check the product name, image, brand, description, and mobile layout.

## 6. Catalog Management: Create a Partner Catalog

Catalogs are product documents for B2B partners.

Steps:

1. Go to Product Management > Catalog Management.
2. Click New Catalog.
3. Enter title, subtitle, and description.
4. Choose a template. If unsure, use Premium.
5. Select products to include.
6. Turn Representative Catalog on if this is the main official catalog.
7. Click Save.
8. Open /catalog and check the result.

Only one Representative Catalog should be used as the main current catalog.

## 7. Dealers: Handle Dealer Applications

Use this section to review companies or people applying to become dealers.

Workflow:

1. Go to Customer Management > Dealers.
2. Open a new application.
3. Check company, contact person, email, phone, city, expected volume, and message.
4. Contact the applicant if needed.
5. Add an internal note.
6. Change the status.
7. Save.

Suggested statuses:

- New: not reviewed yet.
- Reviewing/In Progress: being checked.
- Contacted: already contacted.
- Approved: can continue as a possible partner.
- Rejected/Closed: not proceeding or finished.

Do not delete applications unless they are spam or duplicates.

## 8. Contacts: Handle Messages

Use this section to review contact messages or chatbot/contact records.

Steps:

1. Go to Customer Management > Contacts.
2. Check new messages first.
3. Update status after handling.
4. Keep important records.
5. Delete only spam or incorrect duplicates.

Customer information is private. Share it only with authorized staff.

## 9. Home: Edit the Homepage

Use this section to update the homepage hero, text, images, statistics, and CTA buttons.

Steps:

1. Go to Content Management > Home.
2. Select Home in Page to Edit.
3. Edit the title, subtitle, CTA, or image fields.
4. Click Save Home.
5. Open / and check the homepage.

Common fields:

- Kicker: small text above the title.
- Title: main heading.
- Subtitle: short supporting text.
- Primary CTA: main button.
- Secondary CTA: second button.
- Image URL: public image link.
- Image Alt: image description.

Use Reset only when you really want to return to default content.

## 10. Events: Add Events or Product News

Use this section for events, product launches, or important announcements.

Steps:

1. Go to Content Management > Events.
2. Click New Event.
3. Choose Event or New Product Spotlight.
4. Enter Vietnamese and English titles.
5. Enter a short summary.
6. Add image or video if needed.
7. Turn Featured on if it should be highlighted.
8. Turn Published on when ready.
9. Click Save.
10. Open /events and check the result.

Only publish after both languages are reviewed.

## 11. Popups: Show Website Notices

Popups are for important notices, campaigns, or promotions.

Steps:

1. Go to Content Management > Popups.
2. Click New Popup.
3. Enter title and content.
4. Add an image if needed.
5. Add a CTA button if the popup should link somewhere.
6. Set start and end time if scheduled.
7. Turn Active on.
8. Click Save.
9. Open the public website and check it.

If the popup does not appear, check Active, start time, and end time.

## 12. FAQs: Add Frequently Asked Questions

Use this section to add common questions and answers.

Steps:

1. Go to Content Management > FAQs.
2. Choose the language.
3. Click New FAQ.
4. Enter the question.
5. Enter the answer.
6. Choose a category.
7. Turn Published on.
8. Click Save.

Answers should be short, clear, and easy to understand.

## 13. Chatbot: Update Chatbot Answers

The chatbot uses four simple data types:

- Q&A: short questions and answers.
- Product Info: product information.
- Document Library: long documents for chatbot knowledge.
- Tree Scenario: button-based chatbot flows.

### Add Q&A

1. Go to Content Management > Chatbot.
2. Open the Q&A area.
3. Click New Training Entry.
4. Enter the question and answer.
5. Turn Enabled on.
6. Click Save.

### Add product information

1. Open Product Info.
2. Enter product title or name.
3. Enter benefits, usage, and recommendation notes.
4. Turn Enabled on.
5. Click Save.

### Add a long document

1. Open Document Library.
2. Click New Document.
3. Enter Title and Raw Content.
4. Choose language and category.
5. Click Save.
6. Wait until the system processes the document into chunks.

If chatbot answers do not update immediately, check whether the data is Enabled and whether the document processing is complete.

## 14. Settings: Edit Contact Information

Use this section for company email, phone, address, Zalo, WhatsApp, or contact links.

Steps:

1. Go to Settings.
2. Edit contact information.
3. Click Save Changes.
4. Open /contact and the website footer to check.

Only enter information that is allowed to be public.

## 15. Checklist After Saving

After every edit, check:

- Save button was clicked.
- Success message appeared.
- Public page shows the new content.
- Mobile layout is not broken.
- English and Vietnamese have the same meaning.
- Images appear correctly.
- CTA links open the correct page.

## 16. Common Problems

Cannot login:

- Check email and password.
- Try /auth again.
- If it still fails, contact the system manager.

Saved content does not appear:

- Refresh the public page.
- Check Published or Active.
- Wait a few seconds and try again.

Image does not appear:

- Open the image URL directly.
- If the URL does not open, replace it.

Popup does not appear:

- Check Active.
- Check start and end time.
- Check whether another popup has higher priority.

Chatbot answer is not correct:

- Check whether the data is Enabled.
- For documents, check whether processing is complete.
- Try writing a shorter and clearer Q&A.

## 17. Safety Rules

- Do not share admin passwords.
- Do not delete data unless you are sure.
- Do not put internal information in public fields.
- Do not publish prices, certifications, or performance claims unless approved.
- Do not share customer personal information outside authorized staff.
- For important updates, take a screenshot after checking the public page.
