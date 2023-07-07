import { Handler, NextFunction, Request, Response } from "express";
import statusRes from "../../../lib/stautsRes.js";
import { z } from "zod";
import { getEnvVars } from "../../../lib/k8s/env/getEnvVars.js";
import hasProjectAccess from "../../../lib/access/hasProjectAccess.js";
import { prisma } from "../../../lib/db/prisma.js";
import { addEnvVar, removeEnvVar } from "../../../lib/k8s/env/updateEnvVars.js";

const KEY_PATTER = /[A-Za-z]/;

const postSchema = z.object({
  variables: z.array(
    z.object({
      name: z.string().regex(KEY_PATTER),
      value: z.string(),
    })
  ),
});
const deleteSchema = z.object({
  variables: z.array(z.string().regex(KEY_PATTER)),
});

const paramsSchema = z.object({
  id: z.string().cuid(),
  envId: z.string().cuid(),
});

export const getVariablesHandler: Handler = async (
  req: Request,
  res: Response
) => {
  try {
    const { id, envId } = await paramsSchema.parseAsync(req.params);
    const user = res.locals.user;
    const namespace = `${user.id}-${id}`;

    if (
      !(await hasProjectAccess("read", {
        projectId: id,
        userId: user.id,
      }))
    )
      return res.status(401).send(statusRes("error", "Unauthorized"));

    const env = await prisma.environment.findFirst({
      where: {
        id: envId,
        projectId: id,
      },
    });

    if (!env?.secretName)
      return res.status(200).json({
        status: "success",
        variables: [],
      });

    const vars = await getEnvVars(namespace, env?.secretName);

    const variables = Object.entries(vars.variables).map(([name, value]) => ({
      name,
      value,
    }));

    return res.status(200).json({
      status: "success",
      variables,
    });
  } catch (err: any) {
    res.status(400).send(statusRes("error", err));
  }
};

export const postVariablesHandler: Handler = async (req, res) => {
  try {
    const { variables } = await postSchema.parseAsync(req.body);
    const { id, envId } = await paramsSchema.parseAsync(req.params);
    const user = res.locals.user;
    const namespace = `${user.id}-${id}`;

    if (
      !(await hasProjectAccess("read", {
        projectId: id,
        userId: user.id,
      }))
    )
      return res.status(401).send(statusRes("error", "Unauthorized"));

    const env = await prisma.environment.findFirst({
      where: {
        id: envId,
        projectId: id,
      },
    });

    if (!env?.secretName)
      return res.status(200).json({
        status: "error",
        message: "Unable to update variables, no secret found",
      });

    const varsObject = variables.reduce(
      (obj, item) => Object.assign(obj, { [item.name]: item.value }),
      {}
    );

    console.log(varsObject);

    const { variables: varObject } = await addEnvVar(
      namespace,
      env?.secretName,
      varsObject
    );

    const newVariables = Object.entries(varObject).map(([name, value]) => ({
      name,
      value,
    }));

    return res.status(200).json({
      status: "success",
      variables: newVariables,
    });
  } catch (err: any) {
    res.status(400).send(statusRes("error", err));
  }
};

export const deleteVariablesHandler: Handler = async (req, res) => {
  try {
    const { variables } = await deleteSchema.parseAsync(req.body);
    const { id, envId } = await paramsSchema.parseAsync(req.params);
    const user = res.locals.user;
    const namespace = `${user.id}-${id}`;

    if (
      !(await hasProjectAccess("read", {
        projectId: id,
        userId: user.id,
      }))
    )
      return res.status(401).send(statusRes("error", "Unauthorized"));

    const env = await prisma.environment.findFirst({
      where: {
        id: envId,
        projectId: id,
      },
    });

    if (!env?.secretName)
      return res.status(200).json({
        status: "error",
        message: "Unable to update variables, no secret found",
      });

    const { variables: varObject } = (await removeEnvVar(
      namespace,
      env?.secretName,
      variables
    )) || { env: [] };

    const newVariables = Object.entries(varObject).map(([name, value]) => ({
      name,
      value,
    }));

    return res.status(200).json({
      status: "success",
      variables: newVariables,
    });
  } catch (err: any) {
    res.status(400).send(statusRes("error", err));
  }
};
