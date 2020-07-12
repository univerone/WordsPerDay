import { Wechaty, WechatyPlugin, Message, log, FileBox } from "wechaty";
import { generateImg, getDay, downloadFile, img2base64, getJsonData } from "./utils";

export interface WordsPerDayConfigObject {
  /**
   * The topic of daily message
   * Default: "English"
   */
  type: string;
  /**
   * the name of room to apply this plugin
   * Default: ''
   */
  roomName: string;
  /**
   * the trigger word of this plugin
   * Default: '打卡'
   */
  trigger: string;
}

export type WordsPerDayConfig =
  | Partial<WordsPerDayConfigObject>
  | WordsPerDayConfigObject;

const DEFAULT_CONFIG: WordsPerDayConfigObject = {
  type: "English",
  roomName: "",
  trigger: "打卡",
};

export function WordsPerDay(config?: WordsPerDayConfig): WechatyPlugin {
  log.verbose(
    "WechatyPluginContrib",
    "WordsPerDay(%s)",
    typeof config === "undefined" ? "" : JSON.stringify(config)
  );
  // 补全配置
  const normalizedConfig: WordsPerDayConfigObject = {
    ...DEFAULT_CONFIG,
    ...config,
  };
  return function DingDongPlugin(wechaty: Wechaty) {
    log.verbose(
      "WechatyPluginContrib",
      "DingDong installing on %s ...",
      wechaty
    );

    wechaty.on("message", async (message) => {
      // 监听文字消息
      log.info(message.toString());
      const contact: any = message.from();
      if (message.type() !== Message.Type.Text) {
        log.info("not Text");
        return;
      }

      const room = message.room();
      const text = room ? await message.mentionText() : message.text();

      if (text === normalizedConfig.trigger) {
        let name: string = contact.payload.name;
        let date: string = getDay(); //当前日期
        let path: string =
          "img/" + normalizedConfig.type + "-" + name + "-" + date + ".jpg";
        let avatarPath: string = "img/" + name + ".jpg";
        await downloadFile(contact.payload.avatar, avatarPath);
        switch (normalizedConfig.type) {
          case "English":
            let words: string[] = await getJsonData('http://open.iciba.com/dsapi/',
            ['content','note']
            )
            await generateImg(path, avatarPath, name, date, words).catch((err) => {
              console.error(err);
            });
            const imgFile = FileBox.fromBase64(
              img2base64(path),
              (name = "test.png")
            );
            if (room) {
              await room.say(imgFile);
            } else {
              await contact.say(imgFile);
            }
            break;
        }
      }
    });
  };
}