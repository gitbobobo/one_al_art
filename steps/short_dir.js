import fs from 'fs'
import path from 'path'
import config from '../config.js'

function shortenDirNames(dirPath, prefix = 'folder', counter = { value: 1 }) {
    const items = fs.readdirSync(dirPath);
    const newDirs = [];

    for (var item of items) {
        const fullPath = path.join(dirPath, item);
        const stats = fs.statSync(fullPath);

        if (stats.isDirectory()) {
            const shortName = `${prefix}${counter.value++}`;
            const newFullPath = path.join(dirPath, shortName);

            fs.renameSync(fullPath, newFullPath);
            console.log(`Renamed ${item} to ${shortName}`);
            newDirs.push(newFullPath);
        }
    }

    for (var newDir of newDirs) {
        shortenDirNames(newDir, prefix, counter);
    }
}

// 使用示例，替换以下路径为你的目标文件夹路径
shortenDirNames(config.musicPath);