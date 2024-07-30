import fs from 'fs';
import * as mm from 'music-metadata';
import * as util from 'util';
import path from 'path';
import fse from 'fs-extra';

const musicSuffix = ['.mp3', '.flac', '.wav', '.ape', '.aac', '.m4a', '.ogg', '.wma', '.alac', '.aiff', '.dsd', '.dsf'];
const multiArtistSeparator = [',', '&', ';']

/// 清空文件夹
const emptyDir = (dir) => {
    fse.emptyDir(dir)
  .then(() => {
    console.log('目录已清空');
  })
  .catch(err => {
    console.error(err);
  });
}

const organizeLocalMusicFolder = async (musicFolder, outputDir) => {
    const files = fs.readdirSync(musicFolder);
    for (let i = 0; i < files.length; i++) {
        // 获取当前文件的绝对路径
        const filePath = `${musicFolder}/${files[i]}`;
        // 根据文件路径获取文件信息，返回一个fs.Stats对象
        const stats = fs.statSync(filePath);
        if (stats.isDirectory()) {
            // 如果是文件夹
            await organizeLocalMusicFolder(filePath, outputDir);
        } else if (stats.isFile() && musicSuffix.includes(filePath.slice(filePath.lastIndexOf('.')))) {
            console.log('🎵', filePath)
            try {
                const metadata = await mm.parseFile(filePath);
                var artist = metadata.common.albumartist ?? metadata.common.artist ?? '[Unknown Artist]'
                artist = artist.replace(/[\\/*<>|]/g, '&');
                // Windows 系统文件夹不能包含.和?
                artist = artist.replace(/[.?"]/g, '_');
                var album = metadata.common.album ?? '[Unknown Album]'
                album = album.replace(/[\\/*<>|]/g, '&');
                album = album.replace(/[.?"]/g, '_');
                const destinationFolder = path.join(outputDir, artist, album);
                const destinationPath = path.join(destinationFolder, path.basename(filePath));
                if (filePath !== destinationPath) {
                    if (!fs.existsSync(destinationFolder)) {
                        fs.mkdirSync(destinationFolder, { recursive: true });
                    }
                    fs.renameSync(filePath, destinationPath);
                    console.log('✅ 已移动至', destinationPath);
                }
            } catch (error) {
                console.error('标签解析失败', error.message);
            }
        } else {
            console.log('❌', path.basename(filePath))
        }
    }
}

const checkBeforeUpload = (outputDir) => {
    const files = fs.readdirSync(outputDir);
    const warningFolders = []
    for (let i = 0; i < files.length; i++) {
        // 获取当前文件的绝对路径
        const filePath = `${outputDir}/${files[i]}`;
        // 根据文件路径获取文件信息，返回一个fs.Stats对象
        const stats = fs.statSync(filePath);
        if (stats.isDirectory()) {
            // 如果是文件夹
            if (files[i] === '[Unknown Artist]') {
                warningFolders.push(filePath);
            } else {
                for (let ch of multiArtistSeparator) {
                    if (files[i].includes(ch)) {
                        warningFolders.push(filePath);
                        break;
                    }
                }
            }
        }
    }
    if (warningFolders.length > 0) {
        console.warn('❌ 请检查以下文件夹\n', util.inspect(warningFolders));
    } else {
        console.log('✅ 无异常，可放心上传');
    }
}

export default {
    organizeLocalMusicFolder, checkBeforeUpload, emptyDir
};