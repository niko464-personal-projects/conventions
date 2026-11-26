import type { Rule, Scope } from 'eslint';
import type { Expression, Identifier, Node } from 'estree';

const EFFECT_HOOKS = new Set(['useEffect', 'useLayoutEffect', 'useInsertionEffect']);

const keyName = (key: Node, computed: boolean) => {
  if (key.type === 'Literal') return String(key.value);
  if (key.type === 'Identifier' && !computed) return key.name;
  return null;
};

type FunctionNode = Extract<
  Node,
  { type: 'ArrowFunctionExpression' | 'FunctionExpression' | 'FunctionDeclaration' }
>;

const isFunction = (node: Node | null | undefined): node is FunctionNode =>
  node?.type === 'ArrowFunctionExpression' ||
  node?.type === 'FunctionExpression' ||
  node?.type === 'FunctionDeclaration';

const isUseCallback = (callee: Node) =>
  (callee.type === 'Identifier' && callee.name === 'useCallback') ||
  (callee.type === 'MemberExpression' &&
    keyName(callee.property, callee.computed) === 'useCallback');

export const noEffectHooks: Rule.RuleModule = {
  meta: {
    type: 'problem',
    schema: [],
    messages: {
      effect:
        '{{name}} is banned. Use useMountEffect, useEventListener or useInterval from @niko464/react-kit, a key, deriving the value during render, or Motion for animation. A case none of these covers becomes a new hook in @niko464/react-kit, through a PR.',
      refCleanup:
        'A ref callback may not return a cleanup: React runs it as an effect. Use useMountEffect, useEventListener or useInterval from @niko464/react-kit. A case none of these covers becomes a new hook in @niko464/react-kit, through a PR.',
    },
  },
  create(context) {
    const reportIfEffect = (node: Node, name: string | null) => {
      if (name !== null && EFFECT_HOOKS.has(name)) {
        context.report({ node, messageId: 'effect', data: { name } });
      }
    };

    const reportNamespaceUse = (reference: Scope.Reference) => {
      const identifier = reference.identifier;
      const parent: Node | null = (identifier as Rule.Node).parent;
      if (parent?.type === 'MemberExpression' && parent.object === identifier) {
        reportIfEffect(parent, keyName(parent.property, parent.computed));
      }
      if (
        parent?.type === 'VariableDeclarator' &&
        parent.init === identifier &&
        parent.id.type === 'ObjectPattern'
      ) {
        for (const property of parent.id.properties) {
          if (property.type === 'Property') {
            reportIfEffect(property, keyName(property.key, property.computed));
          }
        }
      }
    };

    const resolve = (identifier: Identifier) => {
      for (
        let scope: Scope.Scope | null = context.sourceCode.getScope(identifier);
        scope;
        scope = scope.upper
      ) {
        const variable = scope.set.get(identifier.name);
        if (variable) return variable.defs.length === 1 ? variable.defs[0] : undefined;
      }
      return undefined;
    };

    const functionBoundTo = (identifier: Identifier) => {
      const definition = resolve(identifier);
      if (definition?.type === 'FunctionName') return definition.node;
      if (definition?.type !== 'Variable' || definition.parent.kind !== 'const') return undefined;
      const init = definition.node.init;
      if (isFunction(init)) return init;
      if (init?.type === 'CallExpression' && isUseCallback(init.callee)) {
        const [callback] = init.arguments;
        if (isFunction(callback)) return callback;
      }
      return undefined;
    };

    const isFunctionValue = (node: Expression) => {
      if (isFunction(node)) return true;
      if (node.type !== 'Identifier') return false;
      const definition = resolve(node);
      return (
        definition?.type === 'FunctionName' ||
        (definition?.type === 'Variable' &&
          definition.parent.kind === 'const' &&
          isFunction(definition.node.init))
      );
    };

    const returnsFunction = (fn: FunctionNode) => {
      if (fn.body.type !== 'BlockStatement') return isFunctionValue(fn.body);
      const visit = (node: Node): boolean => {
        if (node.type === 'ReturnStatement')
          return !!node.argument && isFunctionValue(node.argument);
        if (isFunction(node)) return false;
        const keys = context.sourceCode.visitorKeys[node.type] ?? [];
        return keys.some((key) => {
          const child: unknown = (node as unknown as Record<string, unknown>)[key];
          const children = Array.isArray(child) ? child : [child];
          return children.some(
            (item) =>
              typeof item === 'object' && item !== null && 'type' in item && visit(item as Node),
          );
        });
      };
      return fn.body.body.some(visit);
    };

    return {
      JSXAttribute(node: Rule.Node) {
        const attribute = node as unknown as {
          name: { type: string; name?: string };
          value: { type: string; expression?: Expression } | null;
        };
        if (attribute.name.type !== 'JSXIdentifier' || attribute.name.name !== 'ref') return;
        const expression =
          attribute.value?.type === 'JSXExpressionContainer'
            ? attribute.value.expression
            : undefined;
        if (!expression) return;
        const fn = isFunction(expression)
          ? expression
          : expression.type === 'Identifier'
            ? functionBoundTo(expression)
            : undefined;
        if (fn && returnsFunction(fn)) context.report({ node, messageId: 'refCleanup' });
      },
      ImportDeclaration(node) {
        if (node.source.value !== 'react') return;
        for (const specifier of node.specifiers) {
          const imported =
            specifier.type === 'ImportSpecifier' ? keyName(specifier.imported, false) : 'default';
          if (imported !== 'default') {
            reportIfEffect(specifier, imported);
            continue;
          }
          for (const variable of context.sourceCode.getDeclaredVariables(specifier)) {
            variable.references.forEach(reportNamespaceUse);
          }
        }
      },
      ExportNamedDeclaration(node) {
        if (node.source?.value !== 'react') return;
        for (const specifier of node.specifiers) {
          reportIfEffect(specifier, keyName(specifier.local, false));
        }
      },
    };
  },
};
