import {
  Actions,
  BaseExt,
  Plugin,
} from "https://deno.land/x/dpp_vim@v0.2.0/types.ts";
import { basename, Denops } from "https://deno.land/x/dpp_vim@v0.2.0/deps.ts";
import { isDirectory } from "https://deno.land/x/dpp_vim@v0.2.0/utils.ts";
import { expandGlob } from "jsr:@std/fs@0.224.0/expand-glob";

type Params = Record<string, never>;

type LocalArgs = {
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
