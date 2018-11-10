import fs from 'fs';
import shell from 'shelljs';
import Docker from 'dockerode';
import uuidv4 from 'uuid/v4';

const CURRENT_DIR = __dirname;
const IMAGE_NAME = 'ziboli/cs503';

const client = new Docker();

const TEMP_BUILD_DIR = `${CURRENT_DIR}/tmp`;
const CONTAINER_NAME = `${IMAGE_NAME}:latest`;

const SOURCE_FILE_NAMES = {
	java: 'Example.java',
	python: 'example.py',
	'c++': 'example.cpp'
};

const BINARY_NAMES = {
	java: 'Example',
	python: 'example.py',
	'c++': ''
};

const BUILD_COMMANDS = {
	java: 'javac',
	python: 'python3',
	'c++': 'g++'
};

const EXECUTE_COMMANDS = {
	java: 'java',
	python: 'python3',
	'c++': './a.out'
};

const mkdir = path => {
	try {
		shell.mkdir('-p', path);
	} catch (err) {
		console.log(err);
	}
};

const rm = path => {
	try {
		shell.rm('-rf', path);
	} catch (err) {
		console.log(err);
	}
};

const loadImage = () => {};

export const buildAndRun = (code, lang) => {
	const result = {
		build: null,
		run: null,
		error: null
	};

	const sourceFileParentDirName = uuidv4();
	const sourceFileHostDir = `${TEMP_BUILD_DIR}/${sourceFileParentDirName}`;
	const sourceFileGuestDir = `/test/${sourceFileParentDirName}`;

	mkdir(sourceFileHostDir);

	fs.writeFileSync(`${sourceFileHostDir}/${SOURCE_FILE_NAMES[lang]}`, code);

	return new Promise((resolve, reject) => {
		console.log('starting docker');
		console.log('running ' + BUILD_COMMANDS[lang] + ' ' + SOURCE_FILE_NAMES[lang]);
		client.run(
			IMAGE_NAME,
			[BUILD_COMMANDS[lang], SOURCE_FILE_NAMES[lang]],
			process.stdout,
			{
				Volumes: {
					[sourceFileGuestDir]: {
						mode: 'rw'
					}
				},
				HostConfig: {
					Binds: [`${sourceFileHostDir}:${sourceFileGuestDir}`]
				},
				WorkingDir: sourceFileGuestDir
			},
			(err, data, container) => {
				if (err) {
					console.log('build failed ' + err.message);
					result['error'] = err.message;
					rm(sourceFileHostDir);
					reject(result);
					return;
				}
				console.log('build ok');
				result['build'] = 'ok';
				console.log('starting to run');

				client.run(
					IMAGE_NAME,
					[EXECUTE_COMMANDS[lang], BINARY_NAMES[lang]],
					process.stdout,
					{
						Volumes: {
							[sourceFileGuestDir]: {
								mode: 'rw'
							}
						},
						HostConfig: {
							Binds: [`${sourceFileHostDir}:${sourceFileGuestDir}`]
						},
						WorkingDir: sourceFileGuestDir
					},
					(err, data, container) => {
						if (err) {
							console.log('run failed ' + err);
							result['error'] = err.message;
							rm(sourceFileHostDir);
							reject(result);
							return;
						}
						container.logs({ stdout: 1 }, (err, data) => {
							if (err) {
								console.log('Cannot get running result.' + err);
								result['error'] = err.message;
								reject(result);
								return;
							}
							console.log('docker log ' + data);
							result['run'] = data;
							resolve(result);
						});
					}
				);
			}
		);
	});
};
