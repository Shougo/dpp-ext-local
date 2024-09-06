import { type BaseParams, type Plugin } from "jsr:@shougo/dpp-vim@~3.0.0/types";
import { type Action, BaseExt } from "jsr:@shougo/dpp-vim@~3.0.0/ext";
import { isDirectory } from "jsr:@shougo/dpp-vim@3.0.0/utils";

import type { Denops } from "jsr:@denops/std@~7.1.0";

import { basename } from "jsr:@std/path@~1.0.2/basename";
import { expandGlob } from "jsr:@std/fs@~1.0.1/expand-glob";

export type Params = Record<string, never>;

export type LocalArgs = {
  directory: string;
  options?: Partial<Plugin>;
  includes?: string[];
};

export type ExtActions<Params extends BaseParams> = {
  local: Action<Params, Plugin[]>;
};

export class Ext extends BaseExt<Params> {
  override actions: ExtActions<Params> = {
    local: {
      description: "Load local plugins",
      callback: async (args: {
        denops: Denops;
        actionParams: BaseParams;
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
