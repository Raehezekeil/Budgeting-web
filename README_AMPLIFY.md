# Deployment Instructions: AWS Amplify Gen 2

Your project is now fully configured for AWS Amplify Gen 2!

## 1. Local Development
To run the app locally with the backend sandbox:

```bash
npm run dev
```

To start the backend sandbox (creates real AWS resources for testing):
```bash
npm run amplify:sandbox
```

## 2. Deploying to AWS
Amplify Gen 2 is designed to use **Git-based access**.

1. **Push your code to a Git repository** (GitHub, GitLab, Bitbucket, or AWS CodeCommit).
2. **Open the AWS Amplify Console** in your browser.
3. Click **"Create new app"** -> **"Gen 2"**.
4. Connect your repository.
5. Amplify will detect the `amplify/` folder and `package.json`, and automatically build & deploy both your frontend and backend.
6. Your app will be live at a `https://...amplifyapp.com` URL!

### No Git?
If you cannot use Git, you can manually zip the project (excluding `node_modules`) and try the manual upload feature in Amplify Console (Gen 1 hosting), but you lose the backend CI/CD features.git 
