# 📤 How to Push Your BNPL Project to GitHub

Follow these steps to upload your project to GitHub and share it with judges.

---

## ✅ Prerequisites

1. **Git installed** on your computer
   - Check: Open PowerShell and type `git --version`
   - If not installed: Download from https://git-scm.com/download/win

2. **GitHub account**
   - Create free account at https://github.com if you don't have one

---

## 🚀 Step-by-Step Guide

### Step 1: Create a New Repository on GitHub

1. Go to https://github.com
2. Click the **"+"** icon (top right) → **"New repository"**
3. Fill in details:
   - **Repository name**: `bnpl-hackathon` (or your preferred name)
   - **Description**: "Buy Now Pay Later platform with risk assessment and admin dashboard"
   - **Visibility**: Choose **Public** (so judges can see it)
   - **DO NOT** check "Initialize with README" (we already have one)
4. Click **"Create repository"**
5. **Keep this page open** - you'll need the URL

---

### Step 2: Initialize Git in Your Project

Open **PowerShell** in your project folder and run these commands:

```powershell
# Navigate to your project folder
cd C:\Users\test\Desktop\bnpl-hackathon

# Initialize Git repository
git init

# Add all files (respects .gitignore)
git add .

# Create first commit
git commit -m "Initial commit: BNPL hackathon project"
```

---

### Step 3: Connect to GitHub and Push

Replace `YOUR_USERNAME` with your actual GitHub username:

```powershell
# Add GitHub repository as remote
git remote add origin https://github.com/YOUR_USERNAME/bnpl-hackathon.git

# Push code to GitHub
git branch -M main
git push -u origin main
```

**If prompted for credentials:**
- Username: Your GitHub username
- Password: Use a **Personal Access Token** (not your password)
  - Create token: GitHub → Settings → Developer settings → Personal access tokens → Generate new token
  - Select scope: `repo` (full control)

---

### Step 4: Verify Upload

1. Refresh your GitHub repository page
2. You should see all your files uploaded
3. **Check that these are NOT uploaded** (thanks to .gitignore):
   - ❌ `node_modules/` folder
   - ❌ `.env` file
   - ❌ `*.db` or `*.sqlite` files
   - ❌ `server_log.txt`

---

## 🎯 What Gets Uploaded vs. Ignored

### ✅ Uploaded (Safe for Public)
- ✅ All `.js` files (your code)
- ✅ All `.html`, `.css` files (frontend)
- ✅ `package.json` (dependencies list)
- ✅ `.gitignore` (tells Git what to ignore)
- ✅ `README.md` (project documentation)
- ✅ `.env.example` (template for environment variables)
- ✅ Images in `public/images/`

### ❌ Ignored (Not Uploaded)
- ❌ `node_modules/` (too large, can be reinstalled)
- ❌ `.env` (contains secrets)
- ❌ `*.db`, `*.sqlite` (database files with user data)
- ❌ Log files

---

## 📝 After Uploading

### Add a Nice Repository Description

On your GitHub repository page:
1. Click **"About"** ⚙️ (top right)
2. Add description: "Full-stack BNPL platform with KYC, risk assessment, and admin dashboard"
3. Add topics/tags: `nodejs`, `express`, `sqlite`, `fintech`, `bnpl`, `hackathon`
4. Save

### Share with Judges

Send them the link:
```
https://github.com/YOUR_USERNAME/bnpl-hackathon
```

---

## 🔄 Making Updates Later

If you make changes and want to update GitHub:

```powershell
# Add changed files
git add .

# Commit with message
git commit -m "Description of what you changed"

# Push to GitHub
git push
```

---

## 🆘 Troubleshooting

### Problem: "git: command not found"
**Solution**: Install Git from https://git-scm.com/download/win

### Problem: "Authentication failed"
**Solution**: Use Personal Access Token instead of password
- GitHub → Settings → Developer settings → Personal access tokens → Generate new token

### Problem: "Repository already exists"
**Solution**: Use different repository name or delete existing one on GitHub

### Problem: Files you don't want are being uploaded
**Solution**: Make sure `.gitignore` exists and contains the file patterns to ignore

---

## 💡 Pro Tips for Judges

1. **Add a demo video**: Upload a screen recording to YouTube and link it in README
2. **Add screenshots**: Create a `screenshots/` folder and embed in README
3. **Highlight features**: Make sure README clearly explains what makes your project special
4. **Clean commit history**: Your commits show your development process

---

## ✨ Your Repository is Now Live!

Judges can:
- ✅ View your code
- ✅ Read your documentation
- ✅ Clone and run your project
- ✅ See your commit history
- ✅ Understand your tech stack

**Good luck with your presentation! 🚀**
