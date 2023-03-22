module.exports = ({github, context, versionType, core}) => {

    async function latestRelease() {
        try {
            var latestRelease = await github.rest.repos.getLatestRelease({
                owner: context.repo.owner,
                repo: context.repo.repo
            });
        } catch (error) {
            if (error.message === 'Not Found') {
                return '0.0.0';
            } else {
                core.setFailed(error.message)
            }
        }
        console.log(latestRelease.data.tag_name)
        return latestRelease.data.tag_name
    }

    async function bumpVersion(semanticVersion, versionType) {
        try {
            console.log(`versionType: ${versionType}`)
            let majorNumber = semanticVersion.toString().split(".")[0];
            let minorNumber = semanticVersion.toString().split(".")[1];
            let patchNumber = semanticVersion.toString().split(".")[2];

            let newSemanticVersion = '';

            switch (versionType) {
                case 'MAJOR':
                    majorNumber = parseInt(majorNumber, 10) + 1;
                    newSemanticVersion = majorNumber + ".0.0";
                    break;
                case 'MINOR':
                    minorNumber = parseInt(minorNumber, 10) + 1;
                    newSemanticVersion = majorNumber + "." + minorNumber + ".0"
                    break;
                case 'PATCH':
                    patchNumber = parseInt(patchNumber, 10) + 1;
                    newSemanticVersion = majorNumber + "." + minorNumber + "." + patchNumber;

                    break;
                default:
                    core.setFailed("Could not process the version type. Make sure your string is either 'MAJOR', 'MINOR', or 'PATCH'.");
            }
            console.log('\x1b[32m%s\x1b[0m', `Bumped Semantic Version: ${newSemanticVersion}`);
            return newSemanticVersion
        } catch (error) {
            core.setFailed(error.message);
        }
    }

    async function createBranch(branch) {
        let branchExists;
        try {
            await github.rest.repos.getBranch({
                ...context.repo,
                branch
            })

            branchExists = true;
        } catch (error) {
            if (error.name === 'HttpError' && error.status === 404) {
                await github.rest.git.createRef({
                    ref: `refs/heads/${branch}`,
                    sha: context.sha,
                    ...context.repo
                })
            } else {
                throw Error(error)
            }
        }
    }

    async function createTag(semanticVersion) {

        try {
            await github.rest.git.getRef({
                owner: context.repo.owner,
                repo: context.repo.repo,
                ref: `tags/${semanticVersion}`,
            });

        } catch (error) {
            if (error.name === 'HttpError' && error.status === 404) {
                await github.rest.git.createRef({
                    owner: context.repo.owner,
                    repo: context.repo.repo,
                    ref: `refs/tags/${semanticVersion}`,
                    sha: context.sha
                })
            } else {
                throw Error(error)
            }
        }
    }

    async function main() {
        const semanticVersion = await latestRelease()
        const newSemanticVersion = await bumpVersion(semanticVersion, versionType)
        createBranch(`release/${newSemanticVersion}`)
        await createTag(newSemanticVersion)
        core.setOutput('semanticVersion', semanticVersion);
        core.setOutput('newSemanticVersion', newSemanticVersion);
    }
    main()
    }