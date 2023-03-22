module.exports = async ({github, context, versionType, core}) => {
    try {
      // Get the latest release
      const latestRelease = await github.rest.repos.getLatestRelease({
        owner: context.repo.owner,
        repo: context.repo.repo
      });
  
      // Extract the latest semantic version
      const latestSemanticVersion = latestRelease.data.tag_name;
      console.log(`Latest Semantic Version: ${latestSemanticVersion}`);
  
      // Bump the semantic version based on the version type
      let [major, minor, patch] = latestSemanticVersion.split(".");
      switch (versionType) {
        case "MAJOR":
          major++;
          minor = 0;
          patch = 0;
          break;
        case "MINOR":
          minor++;
          patch = 0;
          break;
        case "PATCH":
          patch++;
          break;
        default:
          throw new Error("Invalid version type. Must be 'MAJOR', 'MINOR', or 'PATCH'.");
      }
      const newSemanticVersion = `${major}.${minor}.${patch}`;
      console.log(`Bumped Semantic Version: ${newSemanticVersion}`);
  
      // Create a new branch and tag for the new semantic version
      const branchName = `release/${newSemanticVersion}`;
      await github.rest.git.createRef({
        owner: context.repo.owner,
        repo: context.repo.repo,
        ref: `refs/heads/${branchName}`,
        sha: context.sha
      });
      console.log(`Created branch: ${branchName}`);
  
      const tagName = newSemanticVersion;
      await github.rest.git.createRef({
        owner: context.repo.owner,
        repo: context.repo.repo,
        ref: `refs/tags/${tagName}`,
        sha: context.sha
      });
      console.log(`Created tag: ${tagName}`);
  
      // Set the outputs
      core.setOutput("semanticVersion", latestSemanticVersion);
      core.setOutput("newSemanticVersion", newSemanticVersion);
    } catch (error) {
      core.setFailed(error.message);
    }
  };
  