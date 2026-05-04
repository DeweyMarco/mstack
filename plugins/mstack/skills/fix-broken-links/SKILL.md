---
name: fix-broken-links
description: Fix broken links in Mintlify documentation projects using `mint broken-links`. Use when the user mentions broken links, link validation, mint broken-links, or asks to fix/check links in docs.
---

# Fix Broken Links

Fix all broken links in a Mintlify documentation project. **You are not done until `mint broken-links` reports success.**

## Workflow

### Step 1: Run the check

```bash
mint broken-links
```

### Step 2: Analyze output

**If success**: You're done.

```
success no broken links found
```

**If broken links found**: The output lists each broken link with:

- The source file containing the broken link
- The broken link target
- Sometimes the line number or context

### Step 3: Fix each broken link

For each broken link:

1. **Read the source file** to understand the context
2. **Determine the correct fix**:
   - **Typo in path**: Correct the path (e.g., `/platfrom/` → `/platform/`)
   - **Missing file**: Either create the file or update the link to an existing file
   - **Renamed file**: Update the link to the new path
   - **Missing anchor**: Remove the anchor or add the heading to the target file
   - **External link**: Verify if link should be internal or update/remove it
3. **Apply the fix** using the appropriate edit tool

### Step 4: Verify

Run `mint broken-links` again.

- **Still broken links?** → Repeat from Step 3

## Important

- **Do not stop** until `mint broken-links` outputs `success no broken links found`
- Fix links one batch at a time, then re-run the check
- If a link target doesn't exist and you're unsure what it should be, ask the user

## Common fixes

| Issue                    | Fix                                       |
| ------------------------ | ----------------------------------------- |
| Path typo                | Correct spelling in the link              |
| Missing `.mdx` extension | Add or remove extension as needed         |
| Wrong case               | Match exact case of target file           |
| Deleted page             | Update link to replacement page or remove |
| Moved page               | Update path to new location               |
