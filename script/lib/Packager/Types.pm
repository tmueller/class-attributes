package Packager::Types;

use Mouse::Util::TypeConstraints;
use Path::Class::Dir;
use Path::Class::File;
use Scalar::Util;
use Data::Dumper;

class_type('Path::Class::Dir');
class_type('Path::Class::File');

subtype 'ArrayRef[Path::Class::File]'
      => as 'ArrayRef'
      => where {
        for my $file (@$_) {
            return 0 unless (Scalar::Util::blessed($file));
            return 0 unless ($file->can('is_dir'));
            return 0 if ($file->is_dir);
        }
        return 1;
    };
      
subtype 'ArrayRef[Path::Class::Dir]'
      => as 'ArrayRef'
      => where {
        for my $file (@$_) {
            return 0 unless (Scalar::Util::blessed($file));
            return 0 unless ($file->can('is_dir'));
            return 0 unless ($file->is_dir);
        }
        return 1;
    };

coerce  'Path::Class::File' => from 'Str' => via { Path::Class::File->new($_) };
coerce  'Path::Class::Dir'  => from 'Str' => via { Path::Class::Dir->new($_) };
coerce  'ArrayRef[Path::Class::File]' => from 'ArrayRef[Str]' => via {
    my $stringarray = $_;
    [ map { Path::Class::File->new($_) } @$stringarray ];
};
coerce  'ArrayRef[Path::Class::Dir]' => from 'ArrayRef[Str]' => via {
    my $stringarray = $_;
    [ map { Path::Class::Dir->new($_) } @$stringarray ];
};



# optionally add Getopt option type
eval { require MouseX::Getopt; };
if ( !$@ ) {
    MouseX::Getopt::OptionTypeMap->add_option_type_to_map( $_, '=s', )
        for ('Path::Class::Dir', 'Path::Class::File');
}

no Mouse::Util::TypeConstraints;
1;