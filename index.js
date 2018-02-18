const fs = require('fs');
const tar = require('tar-fs');
const clone = require('git-clone');
const path = require('path');
const https = require('follow-redirects').https;
const mkdirp = require('mkdirp');
const render = require('react-node-render');
const temp = require('temp');
const npm = require('npm');

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
					Promise.all(profn).then((file) => {
						console.log("Yum Yum");
						let package = require(path.join('tmp', repo.owner, repo.repo, 'package.json'));
						let dependencies = [];
						for (var k in package.dependencies) dependencies.push(k);
						let depPath = []
						dependencies.map(element => {
							depPath.push(tempUse(element));
						});
						Promise.all(depPath).then((dir) => {
							depPath[] = requireMany(dir);
						});
					}).catch((err) => {
						console.log(err)
					});
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
		try {
			let dir = element.filename.substr(0, element.filename.lastIndexOf("/"));
			let file = {
				name: path.basename(element.filename),
				path: dir,
				url: element.raw_url
			}
			mkdirp(file.path, function (err) {
				if (err) {
					reject(err);
				} else {
					let makefile = fs.createWriteStream(path.join('tmp', context.repo().owner, context.repo().repo, file.path, file.name));
					let request = https.get(file.url, function (response) {
						response.pipe(makefile);
					});
					makefile.on('finish', () => {
						resolve(file);
					});
				}
			});
		} catch (err) {
			reject(err);
		}
	});
}

function tempUse(module, cb) {
	return new Promise((reject, resolve) => {
		npm.load({}, function () {
			try {
				npm.commands.install(temp.dir, [module], function (err, data) {
					var dir = data[0][1];
					var mod = require(__dirname + '/' + dir);
					resolve(mod);
				});
			} catch (exception) {
				reject(exception);
			}
		})
	});
}

function requireMany() {
	return Array.prototype.slice.call(arguments).map(require)
}