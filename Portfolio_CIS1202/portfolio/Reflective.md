# Student Reflective AI Note

**Course:** CIS 1202 - Web Development I  
**Week No / Task:** Week 2: Semantic Scaffolding  
**Date:** 2026-02-04 ~ 2026-02-05  

---
## Section 1: The Interaction Log (The "How")
**AI Tool Used:** Gemini 3
* **Primary Prompt:** > "I am a first-year Computer Science student at USC. Help me create a semantic HTML5 portfolio structure based on my background in Web Development."
* **Refinement Steps:** 
	* **Step 1:** The initial AI output generated an overly detailed list of projects that made the page look cluttered and disorganized.
    * **Step 2 (Follow-up Prompt):** I asked the AI to remove the specific project list and instead focus the "About Me" section on my academic journey—specifically my shift from BSIS to Computer Science—and my technical interests in Python and Django.

---
## Section 2: Technical Validation (The "What")

* **Code Explanation:** This code uses HTML5 semantic tags to establish a clear structural backbone for the portfolio. Rather than just listing text, I utilized tags like `<header>`, `<nav>`, `<main>`, and `<footer>` to create a "map" of the site. This allows browsers and **screen readers (tools that read the screen aloud)** to identify the layout's logic. Since screen readers parse code without visual cues, these semantic tags act as landmarks that signal "this is the menu" or "this is the main content," ensuring information is delivered accurately to all users.


* **Manual Edits:** 
    1. **[Grouping Image and Caption]:** I replaced a standard `<img>` tag with a `<figure>` and `<figcaption>` structure to semantically link my profile picture with its descriptive text.
    2. **[Navigation and ID Linking]:** I manually assigned unique `id` attributes to each section and connected them to the navigation menu. This enables "in-page navigation," allowing users to jump to specific sections without manual scrolling.


---
## Section 3: Learning Reflection (The "Why")

* **The "Aha!" Moment:** During this assignment, I discovered the existence of tags like **`<figure>`**, **`<figcaption>`**, and **`<address>`**, which was a real eye-opener. The biggest takeaway was realizing that semantic tags aren't just for organization; they are essential "guides" for users who rely on **screen readers** to navigate the web. Learning about "Web Accessibility" made me realize that good code should be understandable to everyone, even without a visual design. I also learned how to use **`target="_blank"`** to improve user experience by keeping my portfolio open when users visit external links.

* **Documentation Cross-Check:** * [ x ] **Yes** / [ ] No  
    * **Concept verified:** I verified the correct semantic definitions of these tags and the usage of the `target="_blank"` attribute on the [MDN Web Docs](https://developer.mozilla.org/en-US/docs/Web/HTML/Element).


---
## Section 4: Compliance & Integrity Statement
* **Integrity Check:** I confirm that while AI assisted in generating the initial structure/logic, I have manually reviewed, edited, and can fully explain every line of code in this submission.  
* **Signature/Initials:**  GYUAN KIM / G.K.