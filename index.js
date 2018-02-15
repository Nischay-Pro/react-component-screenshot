const fs = require('fs');

module.exports = (robot) => {
	robot.on('pull_request.reopened', receive);
	async function receive(context) {
		// Get all issues for repo with user as creator
		const response = await context.github.issues.getForRepo(context.repo({
			state: 'all',
			creator: context.payload.pull_request.user.login
		}));

		const countPR = response.data.filter(data => data.pull_request);
		try {
			// const config = await context.config('config.yml');
			// console.log(config)
			// if (config.reactComponentScreenShot) {
			// context.github.issues.createComment(context.issue({
			// 	body: 'Hi! This is a test commit'
			// }));
			// }
			// const files = await context.github.pullRequests.getFiles(context.issue());
			// console.log(context);
			let repo = context.repo();
			// let archive = Object.assign(repo, {
			// 	sha: context.payload.pull_request.head,
			// 	recursive: true
			// });
			let archive = Object.assign(context.repo(), {
				archive_format: 'tarball',
				ref: 'heads/master'
			});
			let writeStream = fs.createWriteStream('secret.zip'); 
			const result = await context.github.repos.getArchiveLink(archive);
			writeStream.write(result.data);
			writeStream.on('finish', () => {  
				console.log('wrote all data to file');
			});
			writeStream.end();  
		} catch (err) {
			if (err.code !== 404) {
				throw err;
			}
		}
	}
}