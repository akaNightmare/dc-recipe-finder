import { HttpHeaders } from '@angular/common/http';
import { Provider, inject } from '@angular/core';
import { InMemoryCache } from '@apollo/client/cache';
import { ApolloLink } from '@apollo/client/link';
import { SetContextLink } from '@apollo/client/link/context';
import { provideApollo } from 'apollo-angular';
import { HttpLink } from 'apollo-angular/http';
// @ts-expect-error TS7016: extract-files does not ship declarations for these ESM entrypoint.
import extractFiles from 'extract-files/extractFiles.mjs';
// @ts-expect-error TS7016: extract-files does not ship declarations for these ESM entrypoint.
import isExtractableFile from 'extract-files/isExtractableFile.mjs';
import { environment } from '../environments/environment';
import possibleTypes from './possible-types.json';

const headersLink = new SetContextLink((context) => {
  const token = localStorage.getItem('accessToken');
  let headers =
    context.headers instanceof HttpHeaders
      ? context.headers
      : new HttpHeaders();

  headers = headers.set('Accept', 'charset=utf-8');

  if (token) {
    headers = headers.set('Authorization', `Bearer ${token}`);
  }

  return { headers };
});

export const provideApolloClient = (): Provider =>
  provideApollo(() => {
    const httpLink = inject(HttpLink);

    return {
      cache: new InMemoryCache({
        possibleTypes,
      }),
      link: ApolloLink.from([
        headersLink,
        httpLink.create({
          uri: `${environment.API_URL}q`,
          extractFiles: (body) => extractFiles(body, isExtractableFile),
          useMultipart: true,
        }),
      ]),
      defaultOptions: {
        watchQuery: {
          errorPolicy: 'all',
          fetchPolicy: 'cache-and-network',
          notifyOnNetworkStatusChange: true,
        },
      },
    };
  });
