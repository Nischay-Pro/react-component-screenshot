const fs = require('fs');
const tar = require('tar-fs');
const clone = require('git-clone');
const path = require('path');
const https = require('follow-redirects').https;
const mkdirp = require('mkdirp');

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
			// console.log(context);
			let repo = context.repo();
			// let archive = Object.assign(repo, {
			// 	sha: context.payload.pull_request.head,
			// 	recursive: true
			// });
			// let archive = Object.assign(context.repo(), {
			// 	archive_format: 'tarball',
			// 	ref: 'master'
			// });

			// let writeStream = fs.createWriteStream('secret.tar.gz'); 
			// const result = await context.github.repos.getArchiveLink(archive);
			// console.log(result);
			// writeStream.write(result);
			// writeStream.on('finish', () => {  
			// 	console.log('wrote all data to file');
			// });
			// fs.createReadStream('secret.tar.gz').pipe(tar.extract('./test'));
			// writeStream.end();  
			clone('https://github.com/Nischay-Pro/playground.git', 'tmp/' + repo.owner + '/' + repo.repo, async (err, done) => {
				if (!err) {
					const files = await context.github.pullRequests.getFiles(context.issue());
					let profn = []
					files.data.map(element => {
						profn.push(downloadFile(context, element));
					});
					Promise.all(profn).then(() => {
						console.log('done');
					}).catch(console.log(err));
				} else console.log(err);
			});

		} catch (err) {
			if (err.code !== 404) {
				throw err;
			}
		}
	}
}

async function downloadFile(context, element) {
	return new Promise((reject, resolve) => {
		let file = {
			name: path.basename(element.filename),
			path: path.dirname(element.filename),
			url: element.raw_url
		}
		mkdirp(file.path, function (err) {
			if (err) {
				console.error(err)
				reject(err);
			} else {
				console.log(file.url);
				let makefile = fs.createWriteStream(path.join('tmp', file.path, file.name));
				let request = https.get(file.url, function (response) {
					response.pipe(makefile);
				});
				resolve();
			}
		});
	});
}