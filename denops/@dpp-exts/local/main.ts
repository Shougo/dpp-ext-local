import { type BaseParams, type Plugin } from "@shougo/dpp-vim/types";
import { type Action, BaseExt } from "@shougo/dpp-vim/ext";
import { isDirectory } from "@shougo/dpp-vim/utils";

import type { Denops } from "@denops/std";

import { basename } from "@std/path/basename";
import { expandGlob } from "@std/fs/expand-glob";

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
        ) as string;

        const defaultOptions = params.options ?? {};
        const includes = params.includes ?? ["*"];
        const plugins: Plugin[] = [];

        for (const include of includes) {
          const pattern = `${base}/${include}`;
          for await (const file of expandGlob(pattern)) {
            if (!(await isDirectory(file.path))) {
              continue;
            }

            plugins.push({
              ...defaultOptions,
              repo: file.path,
              local: true,
              path: file.path,
              name: basename(file.path),
            });
          }
        }

        return plugins;
      },
    },
  };

  override params(): Params {
    return {};
  }
}
