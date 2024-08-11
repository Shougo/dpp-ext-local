import {
  type Actions,
  BaseExt,
  type Plugin,
} from "jsr:@shougo/dpp-vim@2.1.0/types";
import { isDirectory } from "jsr:@shougo/dpp-vim@2.1.0/utils";

import type { Denops } from "jsr:@denops/std@~7.0.1";

import { basename } from "jsr:@std/path@1.0.2";
import { expandGlob } from "jsr:@std/fs@1.0.1/expand-glob";

export type Params = Record<string, never>;

export type LocalArgs = {
  directory: string;
  options?: Partial<Plugin>;
  includes?: string[];
};

export class Ext extends BaseExt<Params> {
  override actions: Actions<Params> = {
    local: {
      description: "Load local plugins",
      callback: async (args: {
        denops: Denops;
        actionParams: unknown;
      }) => {
        const params = args.actionParams as LocalArgs;
        const base = await args.denops.call(
          "dpp#util#_expand",
          params.directory,
        );

        const defaultOptions = params.options ?? {};

        let plugins: Plugin[] = [];
        for (const include of params.includes ?? ["*"]) {
          const dirs = [];
          for await (const file of expandGlob(`${base}/${include}`)) {
            if (await isDirectory(file.path)) {
              dirs.push(file.path);
            }
          }

          plugins = plugins.concat(
            dirs.map((dir) => {
              return {
                ...defaultOptions,
                repo: dir,
                local: true,
                path: dir,
                name: basename(dir),
              };
            }),
          );
        }

        return plugins;
      },
    },
  };

  override params(): Params {
    return {};
  }
}
