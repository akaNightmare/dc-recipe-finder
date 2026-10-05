import type { HKT } from '@apollo/client/utilities';

interface PreserveDataValue extends HKT {
    return: this['arg1'];
}

declare module '@apollo/client' {
    export interface TypeOverrides {
        Streaming: PreserveDataValue;
        Partial: PreserveDataValue;
    }

    namespace ApolloClient {
        namespace DeclareDefaultOptions {
            interface WatchQuery {
                errorPolicy?: ErrorPolicy;
            }

            interface Query {
                errorPolicy?: ErrorPolicy;
            }

            interface Mutate {
                errorPolicy?: ErrorPolicy;
            }
        }
    }
}
